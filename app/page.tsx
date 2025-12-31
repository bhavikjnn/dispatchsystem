"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "employee"
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch {
        // User not logged in
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (user) {
    router.push(user.role === "admin" ? "/admin" : "/dashboard")
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dispatch</h1>
                <p className="text-xs text-muted-foreground">Order Management System</p>
              </div>
            </div>
            {!user && (
              <div className="flex gap-3">
                <Button onClick={() => router.push("/login")} className="button-secondary px-6">
                  Login
                </Button>
                <Button onClick={() => router.push("/register")} className="button-primary px-6">
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-border mb-6">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Enterprise Solution</span>
          </div>
          <h2 className="text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
            Professional Order Dispatch Management
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            A secure, comprehensive system designed for enterprises to manage dispatch orders with role-based access
            control, advanced filtering, and complete audit trails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 bg-card border border-border hover:border-primary/30 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-all">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 1112 2.944a11.954 11.954 0 018.618 3.04A11.966 11.966 0 0121 12z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">For Employees</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Create and track dispatch orders securely. View submitted orders and download data with visibility
              controls.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full button-primary">
              Employee Login
            </Button>
          </Card>

          <Card className="p-8 bg-card border border-border hover:border-primary/30 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-all">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">For Administrators</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              View all orders, apply advanced filters, configure field visibility, and access detailed audit logs.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full button-primary">
              Admin Login
            </Button>
          </Card>

          <Card className="p-8 bg-card border border-border hover:border-primary/30 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-all">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">New User</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Create a secure account to access the system. Choose your role during registration.
            </p>
            <Button onClick={() => router.push("/register")} className="w-full button-primary">
              Create Account
            </Button>
          </Card>
        </div>

        <Card className="p-12 bg-card border border-border">
          <h2 className="text-3xl font-bold text-foreground mb-3">Why Dispatch?</h2>
          <p className="text-muted-foreground mb-12">Everything you need for enterprise-level order management</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Secure Authentication</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  JWT-based session management with bcrypt encrypted passwords for maximum security
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Role-Based Access</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Distinct permissions for Admins and Employees with granular control
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Field Visibility Control</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Admins configure which fields are visible to employees on a per-field basis
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Advanced Filtering</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Filter orders by company, destination, date range, payment status, and booking type
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V3.5A1.5 1.5 0 0015.5 2h-11zm4.375 2.625a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5zm2.25 0a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5zm2.25 0a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">CSV Export</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Download full or filtered datasets with automatic field visibility enforcement
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Audit Logging</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track all downloads with employee details, timestamps, and record counts
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-8 text-lg">Ready to streamline your dispatch operations?</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => router.push("/register")} className="button-primary px-8 py-3">
              Get Started Free
            </Button>
            <Button onClick={() => router.push("/login")} className="button-secondary px-8 py-3">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
