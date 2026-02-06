import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import type { Record } from "@/lib/db-utils";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 },
            );
        }

        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        let rows: string[][] = [];

        if (fileExtension === "csv") {
            // Handle CSV files
            const fileContent = await file.text();
            const cleanContent = fileContent.replace(/^\uFEFF/, "");
            const lines = cleanContent
                .split(/\r?\n/)
                .filter((line) => line.trim() && line.trim().length > 0);

            if (lines.length < 2) {
                return NextResponse.json(
                    {
                        error: "File must contain header and at least one data row",
                    },
                    { status: 400 },
                );
            }

            rows = lines.map((line) => parseCSVLine(line));
        } else if (fileExtension === "xlsx" || fileExtension === "xls") {
            // Handle Excel files
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });

            // Get the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to array of arrays
            const data = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: "",
                raw: false,
            }) as string[][];

            // Filter out empty rows
            rows = data.filter((row) =>
                row.some((cell) => cell && cell.toString().trim()),
            );

            if (rows.length < 2) {
                return NextResponse.json(
                    {
                        error: `Sheet "${firstSheetName}" must contain header and at least one data row`,
                    },
                    { status: 400 },
                );
            }
        } else {
            return NextResponse.json(
                {
                    error: "Unsupported file format. Please use CSV, XLSX, or XLS",
                },
                { status: 400 },
            );
        }

        const headers = rows[0].map((h) => h?.toString().trim() || "");
        const expectedColumnCount = 20;

        if (headers.length < expectedColumnCount) {
            return NextResponse.json(
                {
                    error: `Invalid format. Expected ${expectedColumnCount} columns, but found ${headers.length}. Please use the template.`,
                    headers: headers,
                    hint: "Make sure you're using the first sheet and haven't modified the column headers",
                },
                { status: 400 },
            );
        }

        const dataRows = rows.slice(1);

        // First pass: Validate ALL records before inserting any
        const validationErrors: string[] = [];
        const validRecords: Partial<Record>[] = [];

        for (let i = 0; i < dataRows.length; i++) {
            try {
                const values = dataRows[i]
                    .slice(0, expectedColumnCount)
                    .map((v) => v?.toString().trim() || "");

                // Pad with empty strings if row is shorter
                while (values.length < expectedColumnCount) {
                    values.push("");
                }

                // Skip completely empty rows
                if (values.every((v) => !v)) {
                    continue;
                }

                const record: Partial<Record> = {
                    companyName: values[0] || "",
                    contactPerson: values[1] || "",
                    contactNo: values[2] || "",
                    email: values[3] || "",
                    recordRef: values[4] || "",
                    country: values[5] || "",
                    state: values[6] || "",
                    city: values[7] || "",
                    district: values[8] || "",
                    invoiceNo: values[9] || "",
                    invDate: parseDate(values[10] || ""),
                    itemCategory: values[11] || "",
                    itemSubcategory: values[12] || "",
                    rate: Number.parseFloat(values[13] || "0"),
                    qty: Number.parseInt(values[14] || "0", 10),
                    amount: Number.parseFloat(values[15] || "0"),
                    transporterName: values[16] || "",
                    paidOrToPay: (values[17] || "Paid") as "Paid" | "To Pay",
                    bookingType: values[18] || "Standard",
                    paymentDetails: values[19] || "",
                    createdBy: user.userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                // Validate required fields - ONLY Company Name and Item Category
                if (!record.companyName || !record.itemCategory) {
                    const missing = [];
                    if (!record.companyName) missing.push("Company Name");
                    if (!record.itemCategory) missing.push("Item Category");
                    validationErrors.push(
                        `Row ${i + 2}: Missing required fields: ${missing.join(", ")}`,
                    );
                    continue;
                }

                // Validate email only if provided
                if (
                    record.email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)
                ) {
                    validationErrors.push(
                        `Row ${i + 2}: Invalid email format: "${record.email}"`,
                    );
                    continue;
                }

                // Validate date
                if (Number.isNaN(record.invDate?.getTime())) {
                    validationErrors.push(
                        `Row ${i + 2}: Invalid date format: "${values[10]}"`,
                    );
                    continue;
                }

                validRecords.push(record);
            } catch (error) {
                validationErrors.push(
                    `Row ${i + 2}: ${
                        error instanceof Error ? error.message : "Unknown error"
                    }`,
                );
            }
        }

        // If there are ANY validation errors, reject the entire upload
        if (validationErrors.length > 0) {
            return NextResponse.json(
                {
                    error: "Validation failed. No records were uploaded.",
                    success: 0,
                    failed: validationErrors.length,
                    errors: validationErrors,
                    message: `Found ${validationErrors.length} error(s). Please fix all errors and try again.`,
                },
                { status: 400 },
            );
        }

        // All records are valid - now insert them
        const client = await clientPromise;
        const db = client.db("order-dispatch");

        try {
            if (validRecords.length > 0) {
                await db.collection("records").insertMany(validRecords);
            }

            return NextResponse.json({
                success: validRecords.length,
                failed: 0,
                errors: [],
                message: `Successfully uploaded ${validRecords.length} record(s)`,
            });
        } catch (error) {
            return NextResponse.json(
                {
                    error: "Database insertion failed. No records were uploaded.",
                    success: 0,
                    failed: validRecords.length,
                    errors: [
                        error instanceof Error
                            ? error.message
                            : "Unknown database error",
                    ],
                },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Bulk upload error:", error);
        return NextResponse.json(
            {
                error: "Failed to process bulk upload",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}

// Helper function to parse flexible date formats
function parseDate(value: string): Date {
    if (!value || !value.trim()) {
        return new Date();
    }

    value = value.trim();

    // Try standard ISO format first (YYYY-MM-DD)
    let date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
        return date;
    }

    // Try DD.MM.YYYY format (European)
    if (value.includes(".")) {
        const parts = value.split(".");
        if (parts.length === 3) {
            const day = Number.parseInt(parts[0], 10);
            const month = Number.parseInt(parts[1], 10) - 1;
            const year = Number.parseInt(parts[2], 10);
            date = new Date(year, month, day);
            if (!Number.isNaN(date.getTime())) {
                return date;
            }
        }
    }

    // Try DD/MM/YYYY and MM/DD/YYYY formats
    if (value.includes("/")) {
        const parts = value.split("/");
        if (parts.length === 3) {
            const part0 = Number.parseInt(parts[0], 10);
            const part1 = Number.parseInt(parts[1], 10);
            const part2 = Number.parseInt(parts[2], 10);

            // Try DD/MM/YYYY first
            if (part0 <= 31 && part1 <= 12) {
                date = new Date(part2, part1 - 1, part0);
                if (!Number.isNaN(date.getTime())) {
                    return date;
                }
            }

            // Try MM/DD/YYYY (US format)
            if (part0 <= 12 && part1 <= 31) {
                date = new Date(part2, part0 - 1, part1);
                if (!Number.isNaN(date.getTime())) {
                    return date;
                }
            }
        }
    }

    // Try DD-MM-YYYY and MM-DD-YYYY formats
    if (value.includes("-") && value.split("-").length === 3) {
        const parts = value.split("-");
        const part0 = Number.parseInt(parts[0], 10);
        const part1 = Number.parseInt(parts[1], 10);
        const part2 = Number.parseInt(parts[2], 10);

        // Try DD-MM-YYYY first
        if (part0 <= 31 && part1 <= 12) {
            date = new Date(part2, part1 - 1, part0);
            if (!Number.isNaN(date.getTime())) {
                return date;
            }
        }

        // Try MM-DD-YYYY (US format)
        if (part0 <= 12 && part1 <= 31) {
            date = new Date(part2, part0 - 1, part1);
            if (!Number.isNaN(date.getTime())) {
                return date;
            }
        }
    }

    // If all else fails, return current date
    return new Date();
}

// Helper function to parse CSV line handling quoted values properly
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            // Handle escaped quotes ("")
            current += '"';
            i += 2;
            continue;
        }

        if (char === '"') {
            // Toggle quote state
            inQuotes = !inQuotes;
            i++;
            continue;
        }

        if (char === "," && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = "";
            i++;
            continue;
        }

        // Regular character
        current += char;
        i++;
    }

    // Push the last field
    result.push(current.trim());

    return result;
}
