"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface LoginAttempt {
    _id: string;
    userId: string;
    email: string;
    name: string;
    attemptTime: string;
    status: string;
    reason: string;
    allowedHours: {
        startTime: string;
        endTime: string;
    };
    ipAddress: string;
}

export default function BlockedLoginAttempts() {
    const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    useEffect(() => {
        fetchAttempts();
    }, []);

    const fetchAttempts = async () => {
        try {
            const response = await fetch(
                "/api/admin/login-attempts?status=blocked&limit=100"
            );
            if (!response.ok) throw new Error("Failed to fetch login attempts");
            const data = await response.json();
            setAttempts(data.attempts);
        } catch (error) {
            console.error("Error fetching login attempts:", error);
            setMessage({
                type: "error",
                text: "Failed to load login attempts",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClearOld = async () => {
        if (!confirm("Delete login attempts older than 30 days?")) return;

        setDeleting(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/login-attempts?days=30", {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete");

            const data = await response.json();
            setMessage({
                type: "success",
                text: data.message,
            });

            // Refresh the list
            fetchAttempts();
        } catch (error) {
            setMessage({
                type: "error",
                text: "Failed to delete old attempts",
            });
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin"></div>
                    <span className="text-muted-foreground text-sm">
                        Loading attempts...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {message && (
                <div
                    className={`p-4 rounded-lg border ${
                        message.type === "success"
                            ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    }`}
                >
                    {message.text}
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">
                        Blocked Login Attempts
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {attempts.length} blocked attempt
                        {attempts.length !== 1 ? "s" : ""} recorded
                    </p>
                </div>
                <Button
                    onClick={handleClearOld}
                    disabled={deleting || attempts.length === 0}
                    variant="outline"
                    size="sm"
                >
                    {deleting ? "Deleting..." : "Clear Old (30+ days)"}
                </Button>
            </div>

            {attempts.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                    <svg
                        className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p className="text-muted-foreground text-lg font-medium">
                        No blocked login attempts
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                        All employee logins have been within allowed hours
                    </p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Employee
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Attempt Time
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        Allowed Hours
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                        IP Address
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {attempts.map((attempt) => (
                                    <tr
                                        key={attempt._id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                                            {attempt.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {attempt.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {formatDate(attempt.attemptTime)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-md font-mono text-xs">
                                                {attempt.allowedHours.startTime}{" "}
                                                - {attempt.allowedHours.endTime}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                                            {attempt.ipAddress}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {attempts.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-medium mb-1">
                                About Blocked Attempts
                            </p>
                            <p>
                                These logs show when employees tried to log in
                                outside the configured hours. Use this data to
                                identify patterns, adjust hours if needed, or
                                communicate with employees about the policy.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
