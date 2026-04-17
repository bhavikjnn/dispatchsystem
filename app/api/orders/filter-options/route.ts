import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

function normalizeValues(values: unknown[]): string[] {
  return [...new Set(
    values
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b))
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("order-dispatch")

    const [companies, destinations, transporters, bookingTypes, paymentStatuses] = await Promise.all([
      db.collection("orders").distinct("companyName"),
      db.collection("orders").distinct("destination"),
      db.collection("orders").distinct("transporterName"),
      db.collection("orders").distinct("bookingType"),
      db.collection("orders").distinct("paidOrToPay"),
    ])

    return NextResponse.json({
      companies: normalizeValues(companies || []),
      destinations: normalizeValues(destinations || []),
      transporters: normalizeValues(transporters || []),
      bookingTypes: normalizeValues(bookingTypes || []),
      paymentStatuses: normalizeValues(paymentStatuses || []),
    })
  } catch (error) {
    console.error("Filter options error:", error)
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 })
  }
}
