import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { getOrCreateFieldVisibility } from "@/lib/db-utils";

function convertToCSV(data: any[], visibleFields: string[]): string {
    if (data.length === 0) return "";

    const headers = visibleFields;
    const rows = data.map((item) =>
        headers.map((field) => {
            const value = item[field];
            if (value === null || value === undefined) return "";

            // Handle phone numbers and invoice numbers - use tab prefix to force text
            if (field === "contactNo" || field === "invoiceNo") {
                return `"\t${value}"`; // Tab prefix forces Excel to treat as text
            }

            // Handle dates
            if (value instanceof Date) {
                return value.toLocaleDateString();
            }

            // Handle all strings - wrap in quotes to preserve formatting
            if (typeof value === "string") {
                return `"${value.replace(/"/g, '""')}"`;
            }

            return value;
        })
    );

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = "\uFEFF";
    return (
        BOM +
        [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    );
}

function convertToPDFHTML(data: any[], visibleFields: string[]): string {
    if (data.length === 0) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #111; text-align: center; }
        p { text-align: center; color: #666; }
    </style>
</head>
<body>
    <h1>Dispatch Records</h1>
    <p>No records found</p>
</body>
</html>`;
    }

    const headers = visibleFields.map((field) =>
        field
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
    );

    const rows = data
        .map((item) => {
            return `<tr>${visibleFields
                .map((field) => {
                    const value = item[field];
                    if (value === null || value === undefined)
                        return "<td></td>";
                    if (value instanceof Date)
                        return `<td>${value.toLocaleDateString()}</td>`;
                    return `<td>${String(value)
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")}</td>`;
                })
                .join("")}</tr>`;
        })
        .join("");

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { 
            font-family: Arial, sans-serif; 
            font-size: 9px;
            margin: 0;
            padding: 10px;
        }
        h1 { 
            color: #111; 
            text-align: center; 
            font-size: 18px;
            margin-bottom: 5px;
        }
        .meta {
            text-align: center;
            color: #666;
            font-size: 10px;
            margin-bottom: 15px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 8px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 4px 6px; 
            text-align: left;
            word-wrap: break-word;
        }
        th { 
            background-color: #111; 
            color: white; 
            font-weight: bold;
            position: sticky;
            top: 0;
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <h1>Dispatch Records</h1>
    <div class="meta">
        Generated on ${new Date().toLocaleString()} | Total Records: ${
        data.length
    }
    </div>
    <table>
        <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { filters, downloadType, format = "csv" } = await request.json();

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        // Fetch user details from database to get the name
        const { ObjectId } = require("mongodb");
        const userDoc = await db
            .collection("users")
            .findOne({ _id: ObjectId.createFromHexString(user.userId) });
        const userName = userDoc?.name || "Unknown";

        const visibility = await getOrCreateFieldVisibility();

        const visibleFieldNames = Object.entries(visibility.fields)
            .filter(([_, visible]) => visible)
            .map(([field]) => field);

        const query: any = {};

        if (downloadType === "employee" && user.role === "employee") {
            query.createdBy = user.userId;
        }

        if (filters && Object.keys(filters).length > 0) {
            if (filters.company)
                query.companyName = { $regex: filters.company, $options: "i" };
            if (filters.city)
                query.city = { $regex: filters.city, $options: "i" };
            if (filters.state)
                query.state = { $regex: filters.state, $options: "i" };
            if (filters.country)
                query.country = { $regex: filters.country, $options: "i" };
            if (filters.transporter)
                query.transporterName = {
                    $regex: filters.transporter,
                    $options: "i",
                };
            if (filters.bookingType) query.bookingType = filters.bookingType;
            if (filters.paidOrToPay) query.paidOrToPay = filters.paidOrToPay;

            if (filters.startDate || filters.endDate) {
                query.invDate = {};
                if (filters.startDate)
                    query.invDate.$gte = new Date(filters.startDate);
                if (filters.endDate)
                    query.invDate.$lte = new Date(filters.endDate);
            }
        }

        const records = await db.collection("records").find(query).toArray();

        // Filter fields based on visibility
        const filteredRecords = records.map((record) => {
            const filtered: any = {};
            visibleFieldNames.forEach((field) => {
                filtered[field] = record[field];
            });
            return filtered;
        });

        // Log the download
        await db.collection("audit-logs").insertOne({
            employeeId: user.userId,
            employeeEmail: user.email,
            employeeName: userName,
            downloadType:
                Object.keys(filters || {}).length > 0 ? "filtered" : "full",
            filters: filters || {},
            downloadedAt: new Date(),
            recordCount: filteredRecords.length,
            format: format,
        });

        if (format === "pdf") {
            // Generate PDF HTML
            const html = convertToPDFHTML(filteredRecords, visibleFieldNames);

            return new NextResponse(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Content-Disposition": `inline; filename="records-${
                        new Date().toISOString().split("T")[0]
                    }.html"`,
                },
            });
        }

        // Convert to CSV (default)
        const csv = convertToCSV(filteredRecords, visibleFieldNames);

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="records-${
                    new Date().toISOString().split("T")[0]
                }.csv"`,
            },
        });
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json(
            { error: "Failed to download orders" },
            { status: 500 }
        );
    }
}
