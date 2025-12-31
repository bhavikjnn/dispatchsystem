"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import RecordForm from "@/components/record-form";
import RecordsTable from "@/components/records-table";
import DownloadButton from "@/components/download-button";

interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "employee";
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"form" | "table">("form");
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
                // Redirect admins to admin panel
                if (data.user.role === "admin") {
                    router.push("/admin");
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
                                    Employee Dashboard
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
                <div className="flex gap-3 mb-8 border-b border-border">
                    <button
                        onClick={() => setActiveTab("form")}
                        className={`px-4 py-3 font-medium border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === "form"
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
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Create Record
                    </button>
                    <button
                        onClick={() => setActiveTab("table")}
                        className={`px-4 py-3 font-medium border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === "table"
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
                        View Records
                    </button>
                </div>

                {activeTab === "form" && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                Create New Record
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Enter record details to submit a new dispatch
                            </p>
                        </div>
                        <RecordForm
                            onSuccess={() => setRefreshKey((k) => k + 1)}
                        />
                    </div>
                )}

                {activeTab === "table" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">
                                    Your Records
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    View and download your submitted records
                                </p>
                            </div>
                            <DownloadButton
                                downloadType="employee"
                                label="Download Records"
                            />
                        </div>
                        <RecordsTable key={refreshKey} />
                    </div>
                )}
            </div>
        </main>
    );
}
