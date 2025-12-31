import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { getOrCreateFieldVisibility } from "@/lib/db-utils"

function convertToCSV(data: any[], visibleFields: string[]): string {
  if (data.length === 0) return ""

  const headers = visibleFields
  const rows = data.map((item) =>
    headers.map((field) => {
      const value = item[field]
      if (value === null || value === undefined) return ""
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      if (value instanceof Date) {
        return value.toLocaleDateString()
      }
      return value
    }),
  )

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { filters, downloadType } = await request.json()

    const client = await clientPromise
    const db = client.db("order-dispatch")

    const visibility = await getOrCreateFieldVisibility()

    const visibleFieldNames = Object.entries(visibility.fields)
      .filter(([_, visible]) => visible)
      .map(([field]) => field)

    const query: any = {}

    if (downloadType === "employee" && user.role === "employee") {
      query.createdBy = user.userId
    }

    if (filters && Object.keys(filters).length > 0) {
      if (filters.company) query.companyName = { $regex: filters.company, $options: "i" }
      if (filters.destination) query.destination = { $regex: filters.destination, $options: "i" }
      if (filters.transporter) query.transporterName = { $regex: filters.transporter, $options: "i" }
      if (filters.bookingType) query.bookingType = filters.bookingType
      if (filters.paidOrToPay) query.paidOrToPay = filters.paidOrToPay

      if (filters.startDate || filters.endDate) {
        query.invDate = {}
        if (filters.startDate) query.invDate.$gte = new Date(filters.startDate)
        if (filters.endDate) query.invDate.$lte = new Date(filters.endDate)
      }
    }

    const orders = await db.collection("orders").find(query).toArray()

    // Filter fields based on visibility
    const filteredOrders = orders.map((order) => {
      const filtered: any = {}
      visibleFieldNames.forEach((field) => {
        filtered[field] = order[field]
      })
      return filtered
    })

    // Log the download
    await db.collection("audit-logs").insertOne({
      employeeId: user.userId,
      employeeEmail: user.email,
      employeeName: user.name || "Unknown",
      downloadType: Object.keys(filters || {}).length > 0 ? "filtered" : "full",
      filters: filters || {},
      downloadedAt: new Date(),
      recordCount: filteredOrders.length,
    })

    // Convert to CSV
    const csv = convertToCSV(filteredOrders, visibleFieldNames)

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Failed to download orders" }, { status: 500 })
  }
}
