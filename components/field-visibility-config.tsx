"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FieldVisibility {
    [key: string]: boolean;
}

const FIELD_LABELS: Record<string, string> = {
    companyName: "Company Name",
    contactPerson: "Contact Person",
    contactNo: "Contact Number",
    email: "Email",
    recordRef: "Record Reference (GST No/Folio No)",
    city: "City",
    district: "District",
    state: "State",
    country: "Country",
    invoiceNo: "Invoice Number",
    invDate: "Invoice Date",
    itemDescription: "Item Description",
    rate: "Rate",
    qty: "Quantity",
    amount: "Amount",
    transporterName: "Transporter Name",
    paidOrToPay: "Paid or To Pay",
    bookingType: "Booking Type",
    paymentDetails: "Payment Details",
};

export default function FieldVisibilityConfig() {
    const [fields, setFields] = useState<FieldVisibility>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchVisibility = async () => {
            try {
                const response = await fetch("/api/visibility");
                if (!response.ok)
                    throw new Error("Failed to fetch visibility settings");
                const data = await response.json();
                setFields(data.visibility.fields);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "An error occurred"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchVisibility();
    }, []);

    const handleToggle = (fieldName: string) => {
        setFields((prev) => ({
            ...prev,
            [fieldName]: !prev[fieldName],
        }));
        setSuccess(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            const response = await fetch("/api/visibility", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fields }),
            });

            if (!response.ok) {
                throw new Error("Failed to save visibility settings");
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleSelectAll = () => {
        const allVisible: FieldVisibility = {};
        Object.keys(FIELD_LABELS).forEach((field) => {
            allVisible[field] = true;
        });
        setFields(allVisible);
    };

    const handleDeselectAll = () => {
        const allHidden: FieldVisibility = {};
        Object.keys(FIELD_LABELS).forEach((field) => {
            allHidden[field] = false;
        });
        setFields(allHidden);
    };

    if (loading)
        return (
            <Card className="p-12 bg-card border border-border">
                <div className="flex justify-center items-center flex-col gap-4">
                    <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin"></div>
                    <span className="text-muted-foreground text-sm font-medium">
                        Loading...
                    </span>
                </div>
            </Card>
        );

    const visibleCount = Object.values(fields).filter(Boolean).length;

    return (
        <Card className="p-8 bg-card border border-border">
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                    Configure Field Visibility
                </h2>
                <p className="text-muted-foreground text-sm">
                    Currently showing{" "}
                    <span className="font-semibold text-primary">
                        {visibleCount}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-primary">
                        {Object.keys(FIELD_LABELS).length}
                    </span>{" "}
                    fields to employees
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-3">
                    <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
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
            {success && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm flex items-start gap-3">
                    <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>Field visibility updated successfully!</span>
                </div>
            )}

            <div className="flex gap-3 mb-8 flex-wrap">
                <Button
                    onClick={handleSelectAll}
                    className="button-secondary flex items-center gap-2 text-sm"
                >
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Select All
                </Button>
                <Button
                    onClick={handleDeselectAll}
                    className="button-secondary flex items-center gap-2 text-sm"
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
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                    Deselect All
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {Object.entries(FIELD_LABELS).map(([fieldKey, label]) => (
                    <label
                        key={fieldKey}
                        className="flex items-center gap-3 cursor-pointer p-4 border border-border rounded-lg hover:bg-secondary/5 transition-all"
                    >
                        <input
                            type="checkbox"
                            checked={fields[fieldKey] || false}
                            onChange={() => handleToggle(fieldKey)}
                            className="w-5 h-5 rounded cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                            {label}
                        </span>
                    </label>
                ))}
            </div>

            <Button
                onClick={handleSave}
                disabled={saving}
                className="button-primary flex items-center gap-2"
            >
                {saving ? (
                    <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                    </>
                ) : (
                    <>
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
                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                            />
                        </svg>
                        Save Changes
                    </>
                )}
            </Button>
        </Card>
    );
}
