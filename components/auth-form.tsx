"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface AuthFormProps {
  isLogin?: boolean
  onSuccess?: () => void
}

export default function AuthForm({ isLogin = true, onSuccess }: AuthFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "employee",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Authentication failed")
      }

      if (onSuccess) onSuccess()
      if (!isLogin) {
        const userData = await response.json()
        router.push(userData.user.role === "admin" ? "/admin" : "/dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 bg-card border border-border">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h1>
        <p className="text-sm text-muted-foreground">
          {isLogin ? "Sign in to access your dispatch orders" : "Set up your account to get started"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Password</label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
            placeholder="••••••••"
          />
        </div>

        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
              >
                <option value="employee">Employee</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </>
        )}

        <Button type="submit" disabled={loading} className="w-full button-primary py-2 rounded-lg font-medium mt-6">
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
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {isLogin ? (
          <>
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </Card>
  )
}
