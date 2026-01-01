"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BulkUploadProps {
    onSuccess?: () => void;
}

export default function BulkUpload({ onSuccess }: BulkUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [uploadResult, setUploadResult] = useState<{
        success: number;
        failed: number;
        errors: string[];
        sheetsProcessed?: string[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const fileExtension = selectedFile.name
                .split(".")
                .pop()
                ?.toLowerCase();
            if (
                fileExtension === "csv" ||
                fileExtension === "xlsx" ||
                fileExtension === "xls"
            ) {
                setFile(selectedFile);
                setError("");
            } else {
                setError(
                    "Please select a valid CSV or Excel file (.csv, .xlsx, .xls)"
                );
                setFile(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess(false);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Use smart upload for Excel, standard for CSV
            const fileExtension = file.name.split(".").pop()?.toLowerCase();
            const endpoint =
                fileExtension === "xlsx" || fileExtension === "xls"
                    ? "/api/records/bulk-upload-smart"
                    : "/api/records/bulk-upload";

            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setSuccess(true);
            setUploadResult(data);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            if (onSuccess && data.success > 0) onSuccess();

            // Keep success message visible longer if there are errors
            const timeout = data.failed > 0 ? 15000 : 10000;
            setTimeout(() => {
                setSuccess(false);
                setUploadResult(null);
            }, timeout);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = (format: "csv" | "excel") => {
        if (format === "csv") {
            const csvContent = `Company Name,Contact Person,Contact Number,Email,Record Reference,Country,State,City,District,Invoice Number,Invoice Date (YYYY-MM-DD),Item Description,Rate,Quantity,Amount,Transporter Name,Payment Status (Paid/To Pay),Booking Type,Payment Details
Paras Polymers,Mr. Neel,+91 7201877472,neel@paraspolymers.com,By Phone,India,Gujarat,Ahmedabad,Ahmedabad,INV-2025-001,2025-01-15,Plastic Granules,150.50,100,15050,DTDC Courier,Paid,Standard,100% Advance Received
ABC Industries,Ms. Priya,+91 9876543210,priya@abcindustries.com,Email,India,Maharashtra,Mumbai,Mumbai,INV-2025-002,2025-01-16,Steel Rods,200.00,50,10000,Blue Dart,To Pay,Express,50% Advance 50% Against Delivery`;

            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "bulk-upload-template.csv";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            // Download Excel template from static file
            const a = document.createElement("a");
            a.href = "/bulk-upload-template.csv";
            a.download = "bulk-upload-template.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <Card className="p-6 bg-card border border-border">
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Bulk Upload Records
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Upload multiple records at once using CSV or Excel
                            file
                        </p>
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
                            <p className="text-xs font-semibold text-foreground mb-2">
                                📝 Quick Tips:
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>
                                    • Download CSV template and open in
                                    Excel/Google Sheets
                                </li>
                                <li>
                                    • Fill in your data (keep headers unchanged)
                                </li>
                                <li>
                                    • Use only the FIRST sheet if multiple
                                    sheets exist
                                </li>
                                <li>
                                    • Save and upload (Excel .xlsx or CSV format
                                    both work)
                                </li>
                                <li>
                                    • Date format: YYYY-MM-DD (e.g., 2025-01-15)
                                </li>
                                <li>
                                    • Required: Company Name, Contact Person,
                                    Email, Invoice Number
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button
                            onClick={() => downloadTemplate("csv")}
                            className="button-secondary text-sm flex items-center gap-2"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Download Template
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-3">
                        <svg
                            className="w-5 h-5 shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {success && uploadResult && (
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
                        <div className="flex items-start gap-3 mb-2">
                            <svg
                                className="w-5 h-5 shrink-0 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <p className="font-semibold">
                                    Upload completed!
                                </p>
                                <p className="mt-1">
                                    Successfully uploaded:{" "}
                                    {uploadResult.success} records
                                </p>
                                {uploadResult.failed > 0 && (
                                    <p className="text-destructive mt-1">
                                        Failed: {uploadResult.failed} records
                                    </p>
                                )}
                            </div>
                        </div>
                        {uploadResult.errors.length > 0 && (
                            <div className="mt-3 pl-8">
                                <p className="font-semibold mb-1">Errors:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    {uploadResult.errors
                                        .slice(0, 5)
                                        .map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    {uploadResult.errors.length > 5 && (
                                        <li>
                                            ... and{" "}
                                            {uploadResult.errors.length - 5}{" "}
                                            more
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="bulk-upload-input"
                    />
                    <label
                        htmlFor="bulk-upload-input"
                        className="cursor-pointer flex flex-col items-center"
                    >
                        <svg
                            className="w-12 h-12 text-muted-foreground mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="text-sm font-medium text-foreground mb-1">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                            CSV or Excel files (.csv, .xlsx, .xls)
                        </p>
                    </label>
                </div>

                {file && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-input rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                                <svg
                                    className="w-8 h-8 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setFile(null);
                                    setAnalysisResult(null);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = "";
                                    }
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="w-full button-primary"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                            Uploading...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                />
                            </svg>
                            Upload Records
                        </span>
                    )}
                </Button>
            </div>
        </Card>
    );
}
