"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "employee";
}

export default function HomePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch("/api/auth/me");
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                }
            } catch {
                // User not logged in
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (user) {
        router.push(user.role === "admin" ? "/admin" : "/dashboard");
        return null;
    }

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 sm:mb-12">
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-xl flex items-center justify-center">
                            <svg
                                className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">
                        Dispatch
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Order Management System
                    </p>
                </div>

                <Card className="p-6 sm:p-8 md:p-10 bg-card border border-border">
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 text-center">
                        Welcome
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 text-center">
                        Sign in to your account or create a new one
                    </p>

                    <div className="space-y-3 sm:space-y-4">
                        <Button
                            onClick={() => router.push("/login")}
                            className="w-full button-primary h-11 sm:h-12 text-base sm:text-lg"
                        >
                            Login
                        </Button>

                        <Button
                            onClick={() => router.push("/register")}
                            className="w-full button-secondary h-11 sm:h-12 text-base sm:text-lg"
                        >
                            Sign Up
                        </Button>
                    </div>

                    <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border">
                        <div className="space-y-3 sm:space-y-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                <svg
                                    className="w-4 h-4 text-primary"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Secure authentication
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                <svg
                                    className="w-4 h-4 text-primary"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                </svg>
                                Role-based access control
                            </div>
                        </div>
                    </div>
                </Card>

                <p className="text-xs sm:text-sm text-center text-muted-foreground mt-6 sm:mt-8 px-4">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                </p>
            </div>
        </main>
    );
}
