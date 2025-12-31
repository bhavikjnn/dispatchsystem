"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

const BOOKING_TYPES = ["Standard", "Express", "Priority", "Door Delivery"]
const PAYMENT_TYPES = ["Paid", "To Pay"]
const PAYMENT_DETAILS_OPTIONS = [
  "100% Advance Received",
  "100% Against Delivery",
  "50% Advance, 50% Against Delivery",
  "NEFT Payment",
  "Credit Term 30 Days",
  "Bank Transfer",
  "Credit Card",
  "Check Payment",
]

interface OrderFormData {
  companyName: string
  contactPerson: string
  contactNo: string
  email: string
  orderRef: string
  destination: string
  invoiceNo: string
  invDate: string
  itemDescription: string
  rate: number
  qty: number
  amount: number
  transporterName: string
  paidOrToPay: "Paid" | "To Pay"
  bookingType: string
  paymentDetails: string
}

export default function OrderForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<OrderFormData>({
    companyName: "",
    contactPerson: "",
    contactNo: "",
    email: "",
    orderRef: "",
    destination: "",
    invoiceNo: "",
    invDate: "",
    itemDescription: "",
    rate: 0,
    qty: 0,
    amount: 0,
    transporterName: "",
    paidOrToPay: "Paid",
    bookingType: "Standard",
    paymentDetails: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rate" || name === "qty" || name === "amount" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          invDate: new Date(formData.invDate),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create order")
      }

      setSuccess(true)
      setFormData({
        companyName: "",
        contactPerson: "",
        contactNo: "",
        email: "",
        orderRef: "",
        destination: "",
        invoiceNo: "",
        invDate: "",
        itemDescription: "",
        rate: 0,
        qty: 0,
        amount: 0,
        transporterName: "",
        paidOrToPay: "Paid",
        bookingType: "Standard",
        paymentDetails: "",
      })

      if (onSuccess) onSuccess()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 bg-card border border-border">
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Order created successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Company Name *</label>
            <Input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="e.g., Paras Polymers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Contact Person *</label>
            <Input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              required
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="e.g., Mr. Neel"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Contact Number *</label>
            <Input
              type="tel"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleChange}
              required
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="+91 7201877472"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="john@company.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Order Reference *</label>
            <Input
              type="text"
              name="orderRef"
              value={formData.orderRef}
              onChange={handleChange}
              required
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="e.g., By Phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Destination *</label>
            <Input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              required
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="e.g., Delhi"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Invoice Number *</label>
            <Input
              type="text"
              name="invoiceNo"
              value={formData.invoiceNo}
              onChange={handleChange}
              required
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="e.g., INV-2025-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Invoice Date *</label>
            <Input
              type="date"
              name="invDate"
              value={formData.invDate}
              onChange={handleChange}
              required
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Item Description *</label>
          <Textarea
            name="itemDescription"
            value={formData.itemDescription}
            onChange={handleChange}
            required
            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-3 min-h-24"
            placeholder="e.g., Spare parts, Electronic components, Textile materials..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rate (₹) *</label>
            <Input
              type="number"
              name="rate"
              value={formData.rate || ""}
              onChange={handleChange}
              required
              step="0.01"
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Quantity *</label>
            <Input
              type="number"
              name="qty"
              value={formData.qty || ""}
              onChange={handleChange}
              required
              step="1"
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Amount (₹) *</label>
            <Input
              type="number"
              name="amount"
              value={formData.amount || ""}
              onChange={handleChange}
              required
              step="0.01"
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Transporter Name *</label>
            <Input
              type="text"
              name="transporterName"
              value={formData.transporterName}
              onChange={handleChange}
              required
              className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
              placeholder="e.g., DTDC Courier"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Booking Type *</label>
            <select
              name="bookingType"
              value={formData.bookingType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
            >
              {BOOKING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Payment Status *</label>
            <select
              name="paidOrToPay"
              value={formData.paidOrToPay}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
            >
              {PAYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Payment Details</label>
            <select
              name="paymentDetails"
              value={formData.paymentDetails}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
            >
              <option value="">Select payment details...</option>
              {PAYMENT_DETAILS_OPTIONS.map((detail) => (
                <option key={detail} value={detail}>
                  {detail}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full button-primary py-2 rounded-lg font-medium">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              Creating...
            </span>
          ) : (
            "Create Order"
          )}
        </Button>
      </form>
    </Card>
  )
}
