"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface AuditLog {
  _id: string
  employeeId: string
  employeeEmail: string
  employeeName: string
  downloadType: "full" | "filtered"
  filters: Record<string, any>
  downloadedAt: string
  recordCount: number
}

export default function AuditLogsTable() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/audit-logs")
        if (!response.ok) throw new Error("Failed to fetch logs")
        const data = await response.json()
        setLogs(data.logs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  if (loading)
    return (
      <Card className="p-12 bg-card border border-border">
        <div className="flex justify-center items-center flex-col gap-4">
          <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin"></div>
          <span className="text-muted-foreground text-sm font-medium">Loading audit logs...</span>
        </div>
      </Card>
    )
  if (error)
    return (
      <Card className="p-8 bg-card border border-border">
        <div className="text-center">
          <svg className="w-12 h-12 text-destructive mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </Card>
    )
  if (logs.length === 0)
    return (
      <Card className="p-12 bg-card border border-border">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50"
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
          <h3 className="text-lg font-semibold text-foreground mb-1">No downloads yet</h3>
          <p className="text-muted-foreground">Download activity will appear here</p>
        </div>
      </Card>
    )

  return (
    <Card className="border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border bg-secondary/5">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Download Audit Log</h3>
            <p className="text-xs text-muted-foreground mt-1">Track all exports and downloads for compliance</p>
          </div>
          <div className="text-sm font-medium text-foreground bg-primary/10 px-3 py-1 rounded-full">
            {logs.length} downloads
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/10">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-foreground text-xs uppercase whitespace-nowrap">
                Employee
              </th>
              <th className="px-6 py-3 text-left font-semibold text-foreground text-xs uppercase whitespace-nowrap">
                Email
              </th>
              <th className="px-6 py-3 text-left font-semibold text-foreground text-xs uppercase whitespace-nowrap">
                Type
              </th>
              <th className="px-6 py-3 text-left font-semibold text-foreground text-xs uppercase whitespace-nowrap">
                Records
              </th>
              <th className="px-6 py-3 text-left font-semibold text-foreground text-xs uppercase whitespace-nowrap">
                Downloaded
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-secondary/5 transition-colors">
                <td className="px-6 py-4 text-foreground text-sm font-medium">{log.employeeName}</td>
                <td className="px-6 py-4 text-foreground text-sm">{log.employeeEmail}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      log.downloadType === "full" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                    }`}
                  >
                    {log.downloadType === "full" ? "Full" : "Filtered"}
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground text-sm font-mono">{log.recordCount}</td>
                <td className="px-6 py-4 text-muted-foreground text-sm whitespace-nowrap">
                  {new Date(log.downloadedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
