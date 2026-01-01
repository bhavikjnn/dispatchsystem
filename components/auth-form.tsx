"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthFormProps {
    isLogin?: boolean;
    onSuccess?: () => void;
}

export default function AuthForm({ isLogin = true, onSuccess }: AuthFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        role: "employee",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.email || !formData.password) {
            setError("Please enter both email and password.");
            setLoading(false);
            return;
        }

        if (!validateEmail(formData.email)) {
            setError("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        if (!isLogin && !formData.name) {
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
                        ? { email: formData.email, password: formData.password }
                        : formData
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden w-full">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Centered glass card */}
            <div className="relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-2xl p-8 border border-white/10">
                {/* Logo */}
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 backdrop-blur-sm mb-6 mx-auto shadow-lg">
                    <svg
                        className="w-10 h-10 text-primary"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-white mb-2 text-center">
                    {isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-gray-400 text-sm mb-8 text-center">
                    {isLogin
                        ? "Sign in to access your dispatch records"
                        : "Join the dispatch management system"}
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

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
                                name="name"
                                value={formData.name}
                                className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition"
                                onChange={handleChange}
                                required
                            />
                        )}

                        <input
                            placeholder="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition"
                            onChange={handleChange}
                            required
                        />

                        <input
                            placeholder="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition"
                            onChange={handleChange}
                            required
                        />

                        {!isLogin && (
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-5 py-3 rounded-xl bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 transition"
                            >
                                <option
                                    value="employee"
                                    className="bg-[#1e293b] text-white"
                                >
                                    Employee
                                </option>
                                <option
                                    value="admin"
                                    className="bg-[#1e293b] text-white"
                                >
                                    Administrator
                                </option>
                            </select>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                            </span>
                        ) : isLogin ? (
                            "Sign In"
                        ) : (
                            "Create Account"
                        )}
                    </button>

                    <div className="w-full text-center mt-4">
                        <span className="text-sm text-gray-400">
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
                                className="underline text-white/90 hover:text-white font-medium transition"
                            >
                                {isLogin ? "Sign up, it's free!" : "Sign in"}
                            </button>
                        </span>
                    </div>
                </form>
            </div>

            {/* Bottom text */}
            <div className="relative z-10 mt-8 text-center">
                <p className="text-gray-400 text-sm">
                    Secure dispatch management for{" "}
                    <span className="font-semibold text-white">
                        modern businesses
                    </span>
                </p>
            </div>
        </div>
    );
}
