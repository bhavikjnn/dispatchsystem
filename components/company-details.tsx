"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface CompanyDetail {
    _id?: string;
    companyName: string;
    folderNumber: string | number;
    fileNumber: string | number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export default function CompanyDetails() {
    const [details, setDetails] = useState<CompanyDetail[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [formData, setFormData] = useState<CompanyDetail>({
        companyName: "",
        folderNumber: "",
        fileNumber: "",
    });

    // Fetch company details
    useEffect(() => {
        fetchCompanyDetails(currentPage);
    }, [currentPage]);

    const fetchCompanyDetails = async (page: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(
                `/api/admin/company-details?page=${page}&limit=10`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch company details");
            }
            const data = await response.json();
            setDetails(data.data || []);
            setPagination(data.pagination || {});
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to fetch details"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setFormData({
            companyName: "",
            folderNumber: "",
            fileNumber: "",
        });
        setEditingId(null);
        setIsAddingNew(false);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);

            // Validate form
            if (!formData.companyName.trim()) {
                setError("Company name is required");
                return;
            }
            if (!formData.folderNumber) {
                setError("Folder number is required");
                return;
            }
            if (!formData.fileNumber) {
                setError("File number is required");
                return;
            }

            const method = editingId ? "PUT" : "POST";
            const body = editingId
                ? {
                      ...formData,
                      folderNumber: Number(formData.folderNumber),
                      fileNumber: Number(formData.fileNumber),
                  }
                : {
                      companyName: formData.companyName,
                      folderNumber: Number(formData.folderNumber),
                      fileNumber: Number(formData.fileNumber),
                  };

            const response = await fetch("/api/admin/company-details", {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error("Failed to save company details");
            }

            await fetchCompanyDetails(currentPage);
            resetForm();
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save details"
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (detail: CompanyDetail) => {
        setFormData(detail);
        setEditingId(detail._id || null);
        setIsAddingNew(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this company detail?")) {
            return;
        }

        try {
            setError(null);
            const response = await fetch(
                `/api/admin/company-details?id=${id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete company details");
            }

            await fetchCompanyDetails(currentPage);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to delete details"
            );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin"></div>
                    <span className="text-muted-foreground text-sm font-medium">
                        Loading company details...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Add/Edit Form Card */}
            {(isAddingNew || editingId) && (
                <Card className="p-6 bg-blue-50 border border-blue-200">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        {editingId
                            ? "Edit Company Details"
                            : "Add New Company Details"}
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">
                                Company Name
                            </label>
                            <Input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                placeholder="Enter company name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Folder Number
                                </label>
                                <Input
                                    type="number"
                                    name="folderNumber"
                                    value={formData.folderNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter folder number"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    File Number
                                </label>
                                <Input
                                    type="number"
                                    name="fileNumber"
                                    value={formData.fileNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter file number"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 mt-4 border-t border-blue-200">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="button-primary"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    Save
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={resetForm}
                            disabled={isSaving}
                            className="button-secondary"
                        >
                            Cancel
                        </Button>
                    </div>
                </Card>
            )}

            {/* Add Button */}
            {!isAddingNew && !editingId && (
                <Button
                    onClick={() => setIsAddingNew(true)}
                    className="button-primary"
                >
                    <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Add New Company Details
                </Button>
            )}

            {/* Company Details Table */}
            {details.length > 0 ? (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                                        Company Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                                        Folder Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                                        File Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.map((detail) => (
                                    <tr
                                        key={detail._id}
                                        className="border-b border-border hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-foreground">
                                            {detail.companyName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground">
                                            {detail.folderNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground">
                                            {detail.fileNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm flex gap-2">
                                            <Button
                                                onClick={() =>
                                                    handleEdit(detail)
                                                }
                                                disabled={editingId !== null}
                                                className="button-secondary h-8 px-3 text-xs"
                                            >
                                                <svg
                                                    className="w-3 h-3 mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    detail._id &&
                                                    handleDelete(detail._id)
                                                }
                                                disabled={editingId !== null}
                                                className="button-secondary h-8 px-3 text-xs hover:bg-red-100 hover:text-red-700"
                                            >
                                                <svg
                                                    className="w-3 h-3 mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : !isAddingNew && !editingId ? (
                <Card className="p-12 text-center">
                    <svg
                        className="w-12 h-12 mx-auto mb-4 text-muted-foreground"
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
                    <p className="text-muted-foreground mb-4">
                        No company details added yet
                    </p>
                    <Button
                        onClick={() => setIsAddingNew(true)}
                        className="button-primary"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Create First Entry
                    </Button>
                </Card>
            ) : null}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                        {Math.min(
                            currentPage * pagination.limit,
                            pagination.total
                        )}{" "}
                        of {pagination.total} results
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={() =>
                                setCurrentPage(Math.max(currentPage - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className="button-secondary h-8 px-3 text-sm"
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-2">
                            {Array.from(
                                { length: pagination.pages },
                                (_, i) => i + 1
                            ).map((page) => (
                                <Button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 px-3 text-sm ${
                                        currentPage === page
                                            ? "button-primary"
                                            : "button-secondary"
                                    }`}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button
                            onClick={() =>
                                setCurrentPage(
                                    Math.min(currentPage + 1, pagination.pages)
                                )
                            }
                            disabled={currentPage === pagination.pages}
                            className="button-secondary h-8 px-3 text-sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
