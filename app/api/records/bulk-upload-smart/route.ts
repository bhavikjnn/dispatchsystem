import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import type { Record } from "@/lib/db-utils";
import * as XLSX from "xlsx";

// Column mapping - maps your Excel headers to system fields
const COLUMN_MAPPINGS: Record<string, string[]> = {
    companyName: ["company name", "campany name", "company", "firm name"],
    contactPerson: ["contact person", "person", "contact name"],
    contactNo: ["contact no", "contact number", "phone", "mobile"],
    email: ["email", "e-mail", "email id"],
    recordRef: [
        "gst no",
        "gstin",
        "reference",
        "ref",
        "folio no",
        "folio",
        "order reference",
        "order ref",
    ],
    city: ["destination", "city", "location"],
    district: ["district", "dist"],
    state: ["state"],
    country: ["country"],
    invoiceNo: ["invoice no", "inv no", "invoice number", "bill no"],
    invDate: ["inv date", "invoice date", "date", "bill date"],
    itemCategory: ["item category", "category", "product category"],
    itemSubcategory: ["item subcategory", "subcategory", "sub category", "sub-category"],
    rate: ["rate", "price", "unit price"],
    qty: ["qty", "quantity", "units"],
    amount: ["amount", "total", "value"],
    transporterName: ["transporter name", "transporter", "courier"],
    paidOrToPay: ["paid or to pay", "payment mode", "payment type"],
    bookingType: ["booking type", "service type", "type"],
    paymentDetails: [
        "payment details",
        "cod amt",
        "cod amount",
        "payment info",
        "remarks",
        "payment cheque no",
        "cheque no",
    ],
};

function findColumnIndex(headers: string[], fieldMappings: string[]): number {
    const normalizedHeaders = headers.map((h) =>
        h?.toString().toLowerCase().trim()
    );

    for (const mapping of fieldMappings) {
        const index = normalizedHeaders.indexOf(mapping);
        if (index !== -1) return index;
    }

    return -1;
}

function extractValue(row: any[], columnIndex: number): string {
    if (columnIndex === -1) return "";
    return row[columnIndex]?.toString().trim() || "";
}

function parseAmount(value: string): number {
    if (!value) return 0;

    // Remove currency symbols and spaces
    value = value.replace(/[₹$,\s]/g, "");

    // Check if it's a formula like "100+50" or "100 + 50"
    if (value.includes("+")) {
        const parts = value.split("+");
        return parts.reduce((sum, part) => {
            const num = Number.parseFloat(part.trim());
            return sum + (Number.isNaN(num) ? 0 : num);
        }, 0);
    }

    // Check if it's a subtraction like "100-50"
    if (value.includes("-") && value.indexOf("-") > 0) {
        const parts = value.split("-");
        let result = Number.parseFloat(parts[0].trim()) || 0;
        for (let i = 1; i < parts.length; i++) {
            const num = Number.parseFloat(parts[i].trim());
            result -= Number.isNaN(num) ? 0 : num;
        }
        return result;
    }

    // Regular number
    const num = Number.parseFloat(value);
    return Number.isNaN(num) ? 0 : num;
}

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
            const month = Number.parseInt(parts[1], 10) - 1; // Month is 0-indexed
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

            // Try DD/MM/YYYY first (more common internationally)
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

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        if (fileExtension !== "xlsx" && fileExtension !== "xls") {
            return NextResponse.json(
                {
                    error: "Please upload an Excel file (.xlsx or .xls)",
                },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
            sheetsProcessed: [] as string[],
        };

        // Process ALL sheets
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: "",
                raw: false,
            }) as string[][];

            const nonEmptyRows = data.filter((row) =>
                row.some((cell) => cell && cell.toString().trim())
            );

            if (nonEmptyRows.length < 2) {
                continue; // Skip empty sheets
            }

            const headers = nonEmptyRows[0];

            // Check if this sheet has the required columns
            const requiredColumns = [
                ["company", "campany"], // Company Name or Campany Name
                ["contact person", "person"], // Contact Person
                ["email", "e-mail"], // Email
                ["invoice", "inv"], // Invoice No
            ];

            const normalizedHeaders = headers.map((h) =>
                h?.toString().toLowerCase().trim()
            );

            const hasRequiredColumns = requiredColumns.every((variations) =>
                normalizedHeaders.some((header) =>
                    variations.some((variant) => header.includes(variant))
                )
            );

            if (!hasRequiredColumns) {
                results.errors.push(
                    `Skipped sheet "${sheetName}" - missing required columns. Found: ${headers
                        .slice(0, 5)
                        .join(", ")}`
                );
                continue;
            }

            results.sheetsProcessed.push(sheetName);

            const dataRows = nonEmptyRows.slice(1);

            // Map columns
            const columnMap = {
                companyName: findColumnIndex(
                    headers,
                    COLUMN_MAPPINGS.companyName
                ),
                contactPerson: findColumnIndex(
                    headers,
                    COLUMN_MAPPINGS.contactPerson
                ),
                contactNo: findColumnIndex(headers, COLUMN_MAPPINGS.contactNo),
                email: findColumnIndex(headers, COLUMN_MAPPINGS.email),
                recordRef: findColumnIndex(headers, COLUMN_MAPPINGS.recordRef),
                city: findColumnIndex(headers, COLUMN_MAPPINGS.city),
                district: findColumnIndex(headers, COLUMN_MAPPINGS.district),
                state: findColumnIndex(headers, COLUMN_MAPPINGS.state),
                country: findColumnIndex(headers, COLUMN_MAPPINGS.country),
                invoiceNo: findColumnIndex(headers, COLUMN_MAPPINGS.invoiceNo),
                invDate: findColumnIndex(headers, COLUMN_MAPPINGS.invDate),
                itemCategory: findColumnIndex(
                    headers,
                    COLUMN_MAPPINGS.itemCategory
                ),
                itemSubcategory: findColumnIndex(
                    headers,
                    COLUMN_MAPPINGS.itemSubcategory
                ),
                rate: findColumnIndex(headers, COLUMN_MAPPINGS.rate),
                qty: findColumnIndex(headers, COLUMN_MAPPINGS.qty),
                amount: findColumnIndex(headers, COLUMN_MAPPINGS.amount),
                transporterName: findColumnIndex(
                    headers,
                    COLUMN_MAPPINGS.transporterName
                ),
                paidOrToPay: findColumnIndex(
                    headers,
                    COLUMN_MAPPINGS.paidOrToPay
                ),
                bookingType: findColumnIndex(
                    headers,
                    COLUMN_MAPPINGS.bookingType
                ),
                paymentDetails: findColumnIndex(
                    headers,
                    COLUMN_MAPPINGS.paymentDetails
                ),
            };

            // Process each row in batches
            const BATCH_SIZE = 100;
            for (let i = 0; i < dataRows.length; i++) {
                try {
                    const row = dataRows[i];

                    // Skip empty rows
                    if (!row.some((cell) => cell && cell.toString().trim())) {
                        continue;
                    }

                    const record: Partial<Record> = {
                        companyName: extractValue(row, columnMap.companyName),
                        contactPerson: extractValue(
                            row,
                            columnMap.contactPerson
                        ),
                        contactNo: extractValue(row, columnMap.contactNo),
                        email: extractValue(row, columnMap.email),
                        recordRef: extractValue(row, columnMap.recordRef),
                        city: extractValue(row, columnMap.city),
                        district:
                            extractValue(row, columnMap.district) ||
                            extractValue(row, columnMap.city),
                        state: extractValue(row, columnMap.state) || "Unknown",
                        country:
                            extractValue(row, columnMap.country) || "India",
                        invoiceNo: extractValue(row, columnMap.invoiceNo),
                        invDate: parseDate(
                            extractValue(row, columnMap.invDate)
                        ),
                        itemCategory: extractValue(
                            row,
                            columnMap.itemCategory
                        ),
                        itemSubcategory: extractValue(
                            row,
                            columnMap.itemSubcategory
                        ),
                        rate: parseAmount(extractValue(row, columnMap.rate)),
                        qty: Number.parseInt(
                            extractValue(row, columnMap.qty) || "0",
                            10
                        ),
                        amount: parseAmount(
                            extractValue(row, columnMap.amount)
                        ),
                        transporterName: extractValue(
                            row,
                            columnMap.transporterName
                        ),
                        paidOrToPay: (extractValue(
                            row,
                            columnMap.paidOrToPay
                        ) || "Paid") as "Paid" | "To Pay",
                        bookingType:
                            extractValue(row, columnMap.bookingType) ||
                            "Standard",
                        paymentDetails: extractValue(
                            row,
                            columnMap.paymentDetails
                        ),
                        createdBy: user.userId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    // Validate required fields - only Company Name, Contact Person, and Invoice No
                    if (
                        !record.companyName ||
                        !record.contactPerson ||
                        !record.invoiceNo
                    ) {
                        results.failed++;
                        const missing = [];
                        if (!record.companyName) missing.push("Company Name");
                        if (!record.contactPerson)
                            missing.push("Contact Person");
                        if (!record.invoiceNo) missing.push("Invoice Number");
                        results.errors.push(
                            `Sheet "${sheetName}", Row ${
                                i + 2
                            }: Missing ${missing.join(", ")}`
                        );
                        continue;
                    }

                    // Validate email only if provided
                    if (
                        record.email &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)
                    ) {
                        results.failed++;
                        results.errors.push(
                            `Sheet "${sheetName}", Row ${
                                i + 2
                            }: Invalid email format: "${record.email}"`
                        );
                        continue;
                    }

                    // Validate date - should always be valid now with parseDate
                    if (Number.isNaN(record.invDate?.getTime())) {
                        results.failed++;
                        results.errors.push(
                            `Sheet "${sheetName}", Row ${
                                i + 2
                            }: Invalid date format: "${extractValue(
                                row,
                                columnMap.invDate
                            )}" (use DD.MM.YYYY or YYYY-MM-DD)`
                        );
                        continue;
                    }

                    await db.collection("records").insertOne(record);
                    results.success++;
                } catch (error) {
                    results.failed++;
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error";
                    results.errors.push(
                        `Sheet "${sheetName}", Row ${i + 2}: ${errorMessage}`
                    );
                }
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Smart bulk upload error:", error);
        return NextResponse.json(
            {
                error: "Failed to process bulk upload",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
