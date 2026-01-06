"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginHoursSettings {
    enabled: boolean;
    startTime: string;
    endTime: string;
}

export default function GlobalLoginHours() {
    const [settings, setSettings] = useState<LoginHoursSettings>({
        enabled: false,
        startTime: "09:00",
        endTime: "17:00",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/admin/settings");
            if (!response.ok) throw new Error("Failed to fetch settings");
            const data = await response.json();
            setSettings(
                data.settings.employeeLoginHours || {
                    enabled: false,
                    startTime: "09:00",
                    endTime: "17:00",
                }
            );
        } catch (error) {
            console.error("Error fetching settings:", error);
            setMessage({ type: "error", text: "Failed to load settings" });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (enabled: boolean) => {
        setSettings((prev) => ({ ...prev, enabled }));
    };

    const handleTimeChange = (
        field: "startTime" | "endTime",
        value: string
    ) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeLoginHours: settings,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update");
            }

            setMessage({
                type: "success",
                text: "Login hours updated successfully for all employees",
            });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error instanceof Error ? error.message : "Failed to update",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin"></div>
                    <span className="text-muted-foreground text-sm">
                        Loading settings...
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

            <div className="bg-card border border-border rounded-lg p-6">
                <div className="space-y-6">
                    {/* Toggle Section */}
                    <div className="flex items-center justify-between pb-6 border-b border-border">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Restrict Employee Login Hours
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                When enabled, all employees can only log in
                                during the specified time window. Admin accounts
                                are not affected by this restriction.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-6">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => handleToggle(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Time Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Start Time
                            </label>
                            <Input
                                type="time"
                                value={settings.startTime}
                                onChange={(e) =>
                                    handleTimeChange(
                                        "startTime",
                                        e.target.value
                                    )
                                }
                                disabled={!settings.enabled}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Employees can log in starting from this time
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                End Time
                            </label>
                            <Input
                                type="time"
                                value={settings.endTime}
                                onChange={(e) =>
                                    handleTimeChange("endTime", e.target.value)
                                }
                                disabled={!settings.enabled}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Employees cannot log in after this time
                            </p>
                        </div>
                    </div>

                    {/* Info Box */}
                    {settings.enabled && (
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
                                        Active Restriction
                                    </p>
                                    <p>
                                        All employees can only log in between{" "}
                                        <span className="font-semibold">
                                            {settings.startTime}
                                        </span>{" "}
                                        and{" "}
                                        <span className="font-semibold">
                                            {settings.endTime}
                                        </span>
                                        . Login attempts outside this window
                                        will be blocked with an error message.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Examples */}
                    {!settings.enabled && (
                        <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-foreground mb-3">
                                Common Configurations
                            </h4>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono bg-background px-2 py-1 rounded">
                                        09:00 - 17:00
                                    </span>
                                    <span>
                                        Standard business hours (9 AM - 5 PM)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono bg-background px-2 py-1 rounded">
                                        07:00 - 19:00
                                    </span>
                                    <span>Extended hours (7 AM - 7 PM)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono bg-background px-2 py-1 rounded">
                                        22:00 - 06:00
                                    </span>
                                    <span>Night shift (10 PM - 6 AM)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="button-primary px-8"
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </span>
                            ) : (
                                "Save Settings"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
