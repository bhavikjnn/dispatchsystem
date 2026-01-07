"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import AdminFilterPanel from "@/components/admin-filter-panel";
import AdminOrdersTable from "@/components/admin-orders-table";
import AuditLogsTable from "@/components/audit-logs-table";
import DownloadButton from "@/components/download-button";
import FieldVisibilityConfig from "@/components/field-visibility-config";
import GlobalLoginHours from "@/components/global-login-hours";
import BlockedLoginAttempts from "@/components/blocked-login-attempts";
import CompanyDetails from "@/components/company-details";

interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "employee";
}

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<
        "records" | "visibility" | "logs" | "hours" | "company"
    >("records");
    const [filters, setFilters] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch("/api/auth/me");
                if (!response.ok) {
                    router.push("/login");
                    return;
                }
                const data = await response.json();
                if (data.user.role !== "admin") {
                    router.push("/dashboard");
                    return;
                }
                setUser(data.user);
            } catch {
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin"></div>
                    <span className="text-muted-foreground text-sm font-medium">
                        Loading...
                    </span>
                </div>
            </div>
        );
    }
    if (!user) return null;

    return (
        <main className="min-h-screen bg-background">
            <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-primary-foreground"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">
                                    Dispatch
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Administrator Dashboard
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block border-r border-border pr-4">
                                <p className="text-sm font-semibold text-foreground">
                                    {user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                            <Button
                                onClick={handleLogout}
                                className="button-secondary"
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("records")}
                        className={`px-4 py-3 font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === "records"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Records
                    </button>
                    <button
                        onClick={() => setActiveTab("visibility")}
                        className={`px-4 py-3 font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === "visibility"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                        Visibility
                    </button>
                    <button
                        onClick={() => setActiveTab("logs")}
                        className={`px-4 py-3 font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === "logs"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
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
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        Audit Logs
                    </button>
                    <button
                        onClick={() => setActiveTab("hours")}
                        className={`px-4 py-3 font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === "hours"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Login Hours
                    </button>
                    <button
                        onClick={() => setActiveTab("company")}
                        className={`px-4 py-3 font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === "company"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
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
                                d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                            />
                        </svg>
                        Company Details
                    </button>
                </div>

                {activeTab === "records" && (
                    <div className="space-y-6">
                        <AdminFilterPanel onFilter={setFilters} />
                        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">
                                    All Records
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    View and manage dispatch records from all
                                    employees
                                </p>
                            </div>
                            <DownloadButton
                                filters={filters}
                                downloadType="full"
                                label="Download Records"
                            />
                        </div>
                        <AdminOrdersTable
                            filters={filters}
                            refreshKey={refreshKey}
                        />
                    </div>
                )}

                {activeTab === "visibility" && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                Field Visibility Settings
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure which fields employees can see and
                                download
                            </p>
                        </div>
                        <FieldVisibilityConfig />
                    </div>
                )}

                {activeTab === "logs" && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                Download Audit Log
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Track all data downloads and exports for
                                compliance
                            </p>
                        </div>
                        <AuditLogsTable />
                    </div>
                )}

                {activeTab === "hours" && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                Employee Login Hours
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure allowed login hours for all employees
                                to restrict access outside working hours
                            </p>
                        </div>
                        <GlobalLoginHours />

                        <div className="border-t border-border pt-6 mt-8">
                            <BlockedLoginAttempts />
                        </div>
                    </div>
                )}

                {activeTab === "company" && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                Company Details
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage company information including folder and
                                file numbers
                            </p>
                        </div>
                        <CompanyDetails />
                    </div>
                )}
            </div>
        </main>
    );
}
