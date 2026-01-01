"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

interface ModernSignInProps {
    isLogin?: boolean;
    onSuccess?: () => void;
}

const ModernStunningSignIn = ({
    isLogin = true,
    onSuccess,
}: ModernSignInProps) => {
    const router = useRouter();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [role, setRole] = React.useState("employee");
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!email || !password) {
            setError("Please enter both email and password.");
            setLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        if (!isLogin && !name) {
            setError("Please enter your full name.");
            setLoading(false);
            return;
        }

        try {
            const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    isLogin
                        ? { email, password }
                        : { email, password, name, role }
                ),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Authentication failed");
            }

            const userData = await response.json();

            if (onSuccess) onSuccess();

            // Redirect based on user role
            router.push(
                userData.user.role === "admin" ? "/admin" : "/dashboard"
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden w-full p-4">
            {/* Subtle background elements */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-muted rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-muted/50 rounded-full blur-3xl"></div>
            </div>

            {/* Centered card */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card shadow-lg border border-border p-8 flex flex-col items-center">
                {/* Logo */}
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-6 shadow-md">
                    <Zap className="w-7 h-7 text-primary-foreground" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
                    {isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-sm text-muted-foreground mb-6 text-center">
                    {isLogin
                        ? "Sign in to access your dispatch records"
                        : "Join the dispatch management system"}
                </p>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col w-full gap-4"
                >
                    <div className="w-full flex flex-col gap-3">
                        {!isLogin && (
                            <input
                                placeholder="Full Name"
                                type="text"
                                value={name}
                                className="w-full px-4 py-3 rounded-lg bg-input text-foreground placeholder-muted-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        )}

                        <input
                            placeholder="Email"
                            type="email"
                            value={email}
                            className="w-full px-4 py-3 rounded-lg bg-input text-foreground placeholder-muted-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <input
                            placeholder="Password"
                            type="password"
                            value={password}
                            className="w-full px-4 py-3 rounded-lg bg-input text-foreground placeholder-muted-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {!isLogin && (
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-input text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            >
                                <option
                                    value="employee"
                                    className="bg-card text-foreground"
                                >
                                    Employee
                                </option>
                                <option
                                    value="admin"
                                    className="bg-card text-foreground"
                                >
                                    Administrator
                                </option>
                            </select>
                        )}

                        {error && (
                            <div className="text-sm text-destructive text-left bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </span>
                            ) : isLogin ? (
                                "Sign In"
                            ) : (
                                "Create Account"
                            )}
                        </button>

                        <div className="w-full text-center mt-4">
                            <span className="text-sm text-muted-foreground">
                                {isLogin
                                    ? "Don't have an account? "
                                    : "Already have an account? "}
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            isLogin ? "/register" : "/login"
                                        )
                                    }
                                    className="underline text-foreground hover:text-primary font-medium transition-colors"
                                >
                                    {isLogin
                                        ? "Sign up, it's free!"
                                        : "Sign in"}
                                </button>
                            </span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export { ModernStunningSignIn };
