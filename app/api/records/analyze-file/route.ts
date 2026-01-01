import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import * as XLSX from "xlsx";

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
        const analysis: any = {
            fileName: file.name,
            fileSize: file.size,
            fileType: fileExtension,
        };

        if (fileExtension === "csv") {
            const fileContent = await file.text();
            const cleanContent = fileContent.replace(/^\uFEFF/, "");
            const lines = cleanContent.split(/\r?\n/);

            analysis.totalLines = lines.length;
            analysis.firstLine = lines[0];
            analysis.headerColumns = lines[0]?.split(",").length || 0;
            analysis.preview = lines.slice(0, 5);
        } else if (fileExtension === "xlsx" || fileExtension === "xls") {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });

            analysis.totalSheets = workbook.SheetNames.length;
            analysis.sheetNames = workbook.SheetNames;

            // Analyze each sheet
            analysis.sheets = workbook.SheetNames.map((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: "",
                    raw: false,
                }) as string[][];

                const nonEmptyRows = data.filter((row) =>
                    row.some((cell) => cell && cell.toString().trim())
                );

                return {
                    name: sheetName,
                    totalRows: data.length,
                    nonEmptyRows: nonEmptyRows.length,
                    firstRow: nonEmptyRows[0] || [],
                    columnCount: nonEmptyRows[0]?.length || 0,
                    preview: nonEmptyRows.slice(0, 5),
                };
            });

            // First sheet details
            const firstSheet = analysis.sheets[0];
            analysis.firstSheetName = firstSheet.name;
            analysis.firstSheetColumns = firstSheet.columnCount;
            analysis.firstSheetRows = firstSheet.nonEmptyRows;
        }

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("File analysis error:", error);
        return NextResponse.json(
            {
                error: "Failed to analyze file",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
