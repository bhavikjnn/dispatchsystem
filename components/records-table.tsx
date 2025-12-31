"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Record {
    _id: string;
    [key: string]: any;
}

interface FieldVisibility {
    [key: string]: boolean;
}

const ALL_FIELDS = [
    "companyName",
    "contactPerson",
    "contactNo",
    "email",
    "recordRef",
    "city",
    "district",
    "state",
    "country",
    "invoiceNo",
    "invDate",
    "itemDescription",
    "rate",
    "qty",
    "amount",
    "transporterName",
    "paidOrToPay",
    "bookingType",
    "paymentDetails",
];

const FIELD_LABELS: Record<string, string> = {
    companyName: "Company Name",
    contactPerson: "Contact Person",
    contactNo: "Contact Number",
    email: "Email",
    recordRef: "Record Reference",
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

export default function RecordsTable() {
    const [records, setRecords] = useState<Record[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [visibility, setVisibility] = useState<FieldVisibility>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [filterField, setFilterField] = useState("companyName");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [recordsRes, visibilityRes] = await Promise.all([
                    fetch("/api/records"),
                    fetch("/api/visibility"),
                ]);

                if (!recordsRes.ok) throw new Error("Failed to fetch records");
                if (!visibilityRes.ok)
                    throw new Error("Failed to fetch visibility");

                const recordsData = await recordsRes.json();
                const visibilityData = await visibilityRes.json();

                setRecords(recordsData.records || []);
                setFilteredRecords(recordsData.records || []);
                setVisibility(visibilityData.visibility.fields || {});
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "An error occurred"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredRecords(records);
            return;
        }

        const filtered = records.filter((record) => {
            const value = record[filterField];
            if (!value) return false;
            return String(value)
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
        });
        setFilteredRecords(filtered);
    }, [searchTerm, filterField, records]);

    if (loading)
        return (
            <Card className="p-12 bg-card border border-border">
                <div className="flex justify-center items-center flex-col gap-4">
                    <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin"></div>
                    <span className="text-muted-foreground text-sm font-medium">
                        Loading records...
                    </span>
                </div>
            </Card>
        );
    if (error)
        return (
            <Card className="p-8 bg-card border border-border">
                <div className="text-center">
                    <svg
                        className="w-12 h-12 text-destructive mx-auto mb-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <p className="text-destructive font-medium">{error}</p>
                </div>
            </Card>
        );
    if (records.length === 0)
        return (
            <Card className="p-12 bg-card border border-border">
                <div className="text-center">
                    <svg
                        className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50"
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
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                        No records yet
                    </h3>
                    <p className="text-muted-foreground">
                        Create your first record to get started
                    </p>
                </div>
            </Card>
        );

    const visibleColumns = ALL_FIELDS.filter(
        (field) => visibility[field] !== false
    );
    const filterableFields = [
        "companyName",
        "city",
        "state",
        "country",
        "transporterName",
        "invoiceNo",
    ];

    return (
        <Card className="border border-border bg-card overflow-hidden">
            <div className="p-6 border-b border-border bg-secondary/5">
                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Your Records
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Showing {filteredRecords.length} of {records.length}{" "}
                            records ({visibleColumns.length} fields visible)
                        </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            value={filterField}
                            onChange={(e) => setFilterField(e.target.value)}
                            className="px-3 py-2 border border-border rounded-lg text-sm bg-input text-foreground"
                        >
                            {filterableFields.map((field) => (
                                <option key={field} value={field}>
                                    {FIELD_LABELS[field]}
                                </option>
                            ))}
                        </select>
                        <Input
                            type="text"
                            placeholder={`Search by ${FIELD_LABELS[filterField]}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64"
                        />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-border bg-secondary/10">
                        <tr>
                            {visibleColumns.map((col) => (
                                <th
                                    key={col}
                                    className="px-6 py-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider whitespace-nowrap"
                                >
                                    {FIELD_LABELS[col]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredRecords.map((record) => (
                            <tr
                                key={record._id}
                                className="hover:bg-secondary/5 transition-colors"
                            >
                                {visibleColumns.map((col) => (
                                    <td
                                        key={col}
                                        className="px-6 py-4 text-foreground text-sm"
                                    >
                                        {col === "invDate"
                                            ? new Date(
                                                  record[col]
                                              ).toLocaleDateString()
                                            : col === "amount"
                                            ? `₹${Number(record[col]).toFixed(
                                                  2
                                              )}`
                                            : col === "rate"
                                            ? `₹${Number(record[col]).toFixed(
                                                  2
                                              )}`
                                            : String(record[col] || "-")}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
