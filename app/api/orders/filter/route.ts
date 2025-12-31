import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { getOrCreateFieldVisibility } from "@/lib/db-utils"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const filters = await request.json()

    const client = await clientPromise
    const db = client.db("order-dispatch")

    const visibility = await getOrCreateFieldVisibility()

    const query: any = {}

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

    const orders = await db.collection("orders").find(query).sort({ createdAt: -1 }).toArray()

    // Filter fields based on visibility
    const filteredOrders = orders.map((order) => {
      const filtered: any = {}
      Object.entries(visibility.fields).forEach(([field, visible]) => {
        if (visible) {
          filtered[field] = order[field]
        }
      })
      filtered._id = order._id
      return filtered
    })

    return NextResponse.json({ orders: filteredOrders, count: filteredOrders.length })
  } catch (error) {
    console.error("Filter error:", error)
    return NextResponse.json({ error: "Failed to filter orders" }, { status: 500 })
  }
}
