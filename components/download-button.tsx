"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
    filters?: Record<string, any>;
    downloadType?: "full" | "filtered" | "employee";
    label?: string;
}

export default function DownloadButton({
    filters,
    downloadType = "full",
    label = "Download",
}: DownloadButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleDownload = async (format: "csv" | "pdf") => {
        setLoading(true);
        setError("");
        setSuccess(false);
        setShowMenu(false);

        try {
            const response = await fetch("/api/orders/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filters: filters || {},
                    downloadType,
                    format,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to download");
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

            const blob = await response.blob();

            if (format === "pdf") {
                // For PDF, open HTML in new window and trigger print
                const html = await blob.text();
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.print();
                    }, 250);
                }
            } else {
                // For CSV, download directly
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `records-${
                    new Date().toISOString().split("T")[0]
                }.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Download failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <div className="flex gap-2">
                <Button
                    onClick={() => handleDownload("csv")}
                    disabled={loading}
                    className="button-primary flex items-center gap-2"
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                    {loading ? "Downloading..." : `${label} CSV`}
                </Button>
                <Button
                    onClick={() => handleDownload("pdf")}
                    disabled={loading}
                    className="button-secondary flex items-center gap-2"
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
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                    {loading ? "Downloading..." : `${label} PDF`}
                </Button>
            </div>
            {error && (
                <p className="text-destructive text-sm mt-2 flex items-center gap-2">
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {error}
                </p>
            )}
            {success && (
                <p className="text-primary text-sm mt-2 flex items-center gap-2">
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Download started
                </p>
            )}
        </div>
    );
}
