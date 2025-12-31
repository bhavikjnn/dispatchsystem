"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface Order {
  _id: string
  [key: string]: any
}

interface FieldVisibility {
  [key: string]: boolean
}

const ALL_FIELDS = [
  "companyName",
  "contactPerson",
  "contactNo",
  "email",
  "orderRef",
  "destination",
  "invoiceNo",
  "invDate",
  "itemDescription",
  "rate",
  "qty",
  "amount",
  "transporterName",
  "paidOrToPay",
  "bookingType",
  "paymentDetails",
]

const FIELD_LABELS: Record<string, string> = {
  companyName: "Company Name",
  contactPerson: "Contact Person",
  contactNo: "Contact Number",
  email: "Email",
  orderRef: "Order Reference",
  destination: "Destination",
  invoiceNo: "Invoice Number",
  invDate: "Invoice Date",
  itemDescription: "Item Description",
  rate: "Rate",
  qty: "Quantity",
  amount: "Amount",
  transporterName: "Transporter Name",
  paidOrToPay: "Paid or To Pay",
  bookingType: "Booking Type",
  paymentDetails: "Payment Details",
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [visibility, setVisibility] = useState<FieldVisibility>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, visibilityRes] = await Promise.all([fetch("/api/orders"), fetch("/api/visibility")])

        if (!ordersRes.ok) throw new Error("Failed to fetch orders")
        if (!visibilityRes.ok) throw new Error("Failed to fetch visibility")

        const ordersData = await ordersRes.json()
        const visibilityData = await visibilityRes.json()

        setOrders(ordersData.orders || [])
        setVisibility(visibilityData.visibility.fields || {})
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading)
    return (
      <Card className="p-12 bg-card border border-border">
        <div className="flex justify-center items-center flex-col gap-4">
          <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin"></div>
          <span className="text-muted-foreground text-sm font-medium">Loading orders...</span>
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
  if (orders.length === 0)
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-foreground mb-1">No orders yet</h3>
          <p className="text-muted-foreground">Create your first order to get started</p>
        </div>
      </Card>
    )

  const visibleColumns = ALL_FIELDS.filter((field) => visibility[field] !== false)

  return (
    <Card className="border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border bg-secondary/5">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Your Orders</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Showing {visibleColumns.length} of {ALL_FIELDS.length} fields
            </p>
          </div>
          <div className="text-sm font-medium text-foreground bg-primary/10 px-3 py-1 rounded-full">
            {orders.length} orders
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/10">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider whitespace-nowrap"
                >
                  {FIELD_LABELS[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-secondary/5 transition-colors">
                {visibleColumns.map((col) => (
                  <td key={col} className="px-6 py-4 text-foreground text-sm">
                    {col === "invDate"
                      ? new Date(order[col]).toLocaleDateString()
                      : col === "amount"
                        ? `₹${Number(order[col]).toFixed(2)}`
                        : col === "rate"
                          ? `₹${Number(order[col]).toFixed(2)}`
                          : String(order[col] || "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
