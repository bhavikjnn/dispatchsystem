"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

interface Order {
    _id: string;
    [key: string]: any;
}

interface AdminOrdersTableProps {
    filters: Record<string, any>;
    refreshKey: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const ALL_FIELDS = [
    "companyName",
    "itemCategory",
    "itemSubcategory",
    "city",
    "state",
    "district",
    "country",
    "contactPerson",
    "contactNo",
    "email",
    "recordRef",
    "invoiceNo",
    "invDate",
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
    itemCategory: "Item Category",
    itemSubcategory: "Item Subcategory",
    rate: "Rate",
    qty: "Quantity",
    amount: "Amount",
    transporterName: "Transporter Name",
    paidOrToPay: "Paid or To Pay",
    bookingType: "Booking Type",
    paymentDetails: "Payment Details",
};

export default function AdminOrdersTable({
    filters,
    refreshKey,
}: AdminOrdersTableProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const fetchOrders = async (page: number) => {
        try {
            setLoading(true);
            const response = await fetch("/api/records/filter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...filters,
                    page,
                    limit: pagination.limit,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch filtered records");
            }

            const data = await response.json();
            setOrders(data.records || []);
            setPagination(
                data.pagination || {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                }
            );
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset to page 1 when filters change
        fetchOrders(1);
    }, [filters, refreshKey]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchOrders(newPage);
        }
    };

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
    if (pagination.total === 0)
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
                        No records found
                    </h3>
                    <p className="text-muted-foreground">
                        Try adjusting your filters or create some records first
                    </p>
                </div>
            </Card>
        );

    const columns = ALL_FIELDS;

    return (
        <Card className="border border-border bg-card overflow-hidden">
            <div className="p-6 border-b border-border bg-secondary/5">
                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            All Records
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Admin view: All {columns.length} fields visible
                        </p>
                    </div>
                    <div className="text-sm font-medium text-foreground bg-primary/10 px-3 py-1 rounded-full">
                        {pagination.total} total records
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-border bg-secondary/10">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-6 py-3 text-left font-semibold text-foreground text-xs uppercase whitespace-nowrap"
                                >
                                    {FIELD_LABELS[col]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.map((order) => (
                            <tr
                                key={order._id}
                                className="hover:bg-secondary/5 transition-colors"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col}
                                        className="px-6 py-4 text-foreground text-sm"
                                    >
                                        {col === "invDate"
                                            ? new Date(
                                                  order[col]
                                              ).toLocaleDateString()
                                            : col === "amount"
                                            ? `₹${Number(order[col]).toFixed(
                                                  2
                                              )}`
                                            : col === "rate"
                                            ? `₹${Number(order[col]).toFixed(
                                                  2
                                              )}`
                                            : String(order[col] || "-")}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages} (
                        {pagination.total} total records)
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.page === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                handlePageChange(pagination.page - 1)
                            }
                            disabled={pagination.page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-3 py-1 text-sm font-medium">
                            {pagination.page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                handlePageChange(pagination.page + 1)
                            }
                            disabled={pagination.page === pagination.totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                handlePageChange(pagination.totalPages)
                            }
                            disabled={pagination.page === pagination.totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
