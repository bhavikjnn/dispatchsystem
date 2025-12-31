import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import type { Order } from "@/lib/db-utils"
import { getOrCreateFieldVisibility } from "@/lib/db-utils"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const client = await clientPromise
    const db = client.db("order-dispatch")

    const order: Order = {
      ...data,
      createdBy: user.userId as string,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("orders").insertOne(order)

    return NextResponse.json({ success: true, orderId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("order-dispatch")

    const visibility = await getOrCreateFieldVisibility()

    const query: any = {}

    if (user.role === "employee") {
      query.createdBy = user.userId
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

    return NextResponse.json({ orders: filteredOrders })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
