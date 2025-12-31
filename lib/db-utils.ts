import clientPromise from "./mongodb"
import type { ObjectId } from "mongodb"

export interface Order {
  _id?: ObjectId
  companyName: string
  contactPerson: string
  contactNo: string
  email: string
  orderRef: string
  destination: string
  invoiceNo: string
  invDate: Date
  itemDescription: string
  rate: number
  qty: number
  amount: number
  transporterName: string
  paidOrToPay: "Paid" | "To Pay"
  bookingType: string
  paymentDetails: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface FieldVisibility {
  _id?: ObjectId
  fields: {
    companyName: boolean
    contactPerson: boolean
    contactNo: boolean
    email: boolean
    orderRef: boolean
    destination: boolean
    invoiceNo: boolean
    invDate: boolean
    itemDescription: boolean
    rate: boolean
    qty: boolean
    amount: boolean
    transporterName: boolean
    paidOrToPay: boolean
    bookingType: boolean
    paymentDetails: boolean
  }
  updatedAt: Date
}

export interface AuditLog {
  _id?: ObjectId
  employeeId: string
  employeeEmail: string
  employeeName: string
  downloadType: "full" | "filtered"
  filters: Record<string, any>
  downloadedAt: Date
  recordCount: number
}

export async function initializeDatabase() {
  const client = await clientPromise
  const db = client.db("order-dispatch")

  // Create collections
  await db.createCollection("users").catch(() => {})
  await db.createCollection("orders").catch(() => {})
  await db.createCollection("field-visibility").catch(() => {})
  await db.createCollection("audit-logs").catch(() => {})

  // Create indexes
  await db.collection("users").createIndex({ email: 1 }, { unique: true })
  await db.collection("orders").createIndex({ createdAt: -1 })
  await db.collection("orders").createIndex({ companyName: 1 })
  await db.collection("orders").createIndex({ destination: 1 })
  await db.collection("audit-logs").createIndex({ downloadedAt: -1 })
}

export async function getOrCreateFieldVisibility(): Promise<FieldVisibility> {
  const client = await clientPromise
  const db = client.db("order-dispatch")

  const visibility = await db.collection("field-visibility").findOne({})

  if (!visibility) {
    const defaultVisibility: FieldVisibility = {
      fields: {
        companyName: true,
        contactPerson: true,
        contactNo: true,
        email: true,
        orderRef: true,
        destination: true,
        invoiceNo: true,
        invDate: true,
        itemDescription: true,
        rate: true,
        qty: true,
        amount: true,
        transporterName: true,
        paidOrToPay: true,
        bookingType: true,
        paymentDetails: true,
      },
      updatedAt: new Date(),
    }

    await db.collection("field-visibility").insertOne(defaultVisibility)
    return defaultVisibility
  }

  return visibility as FieldVisibility
}
