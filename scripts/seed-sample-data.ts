import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/order-dispatch"

const SAMPLE_ORDERS = [
  {
    companyName: "Paras Polymers",
    contactPerson: "Mr. Neel",
    contactNo: "7201877472",
    email: "neelmani.vyas@gmail.com",
    orderRef: "By Phone",
    destination: "Delhi",
    invoiceNo: "1",
    invDate: new Date("2025-04-01"),
    itemDescription: "Spare",
    rate: 8024,
    qty: 1,
    amount: 8024,
    transporterName: "DTDC Courier",
    paidOrToPay: "Paid",
    bookingType: "Door Delivery",
    paymentDetails: "100% Advance Received",
    createdBy: "admin-seed",
    createdAt: new Date("2025-04-01"),
    updatedAt: new Date("2025-04-01"),
  },
  {
    companyName: "PN Safetech Private Limited",
    contactPerson: "Ms. Sunita",
    contactNo: "8188063976",
    email: "anshika.bajpai@karam.in",
    orderRef: "PO-24221003880",
    destination: "Nadarganj",
    invoiceNo: "2",
    invDate: new Date("2025-04-01"),
    itemDescription: "Spare",
    rate: 7670,
    qty: 1,
    amount: 7670,
    transporterName: "DTDC Courier",
    paidOrToPay: "Paid",
    bookingType: "Door Delivery",
    paymentDetails: "100% Against Delivery",
    createdBy: "admin-seed",
    createdAt: new Date("2025-04-01"),
    updatedAt: new Date("2025-04-01"),
  },
  {
    companyName: "SLK Food Processing",
    contactPerson: "Mr. Abdul",
    contactNo: "9645547770",
    email: "slkfoods@gmail.com",
    orderRef: "PO-SLK/TMHE/397/2024-25",
    destination: "Kozhikode",
    invoiceNo: "3",
    invDate: new Date("2025-04-01"),
    itemDescription: "Spare",
    rate: 12154,
    qty: 1,
    amount: 12154,
    transporterName: "DTDC Courier",
    paidOrToPay: "Paid",
    bookingType: "Door Delivery",
    paymentDetails: "100% Advance Received",
    createdBy: "admin-seed",
    createdAt: new Date("2025-04-01"),
    updatedAt: new Date("2025-04-01"),
  },
  {
    companyName: "TechFlow Solutions",
    contactPerson: "Ms. Priya",
    contactNo: "9876543210",
    email: "priya@techflow.com",
    orderRef: "ORD-2025-004",
    destination: "Bangalore",
    invoiceNo: "4",
    invDate: new Date("2025-04-02"),
    itemDescription: "Electronic Components",
    rate: 15000,
    qty: 5,
    amount: 75000,
    transporterName: "BlueDart Express",
    paidOrToPay: "Paid",
    bookingType: "Express",
    paymentDetails: "50% Advance, 50% Against Delivery",
    createdBy: "admin-seed",
    createdAt: new Date("2025-04-02"),
    updatedAt: new Date("2025-04-02"),
  },
  {
    companyName: "Global Imports Ltd",
    contactPerson: "Mr. Rajesh",
    contactNo: "9123456789",
    email: "rajesh@globalimports.com",
    orderRef: "GI-2025-105",
    destination: "Mumbai",
    invoiceNo: "5",
    invDate: new Date("2025-04-02"),
    itemDescription: "Textile Materials",
    rate: 5500,
    qty: 20,
    amount: 110000,
    transporterName: "Professional Couriers",
    paidOrToPay: "To Pay",
    bookingType: "Standard",
    paymentDetails: "100% Against Delivery",
    createdBy: "admin-seed",
    createdAt: new Date("2025-04-02"),
    updatedAt: new Date("2025-04-02"),
  },
  {
    companyName: "Green Logistics",
    contactPerson: "Ms. Anita",
    contactNo: "8765432109",
    email: "anita@greenlogistics.com",
    orderRef: "GL-2025-067",
    destination: "Pune",
    invoiceNo: "6",
    invDate: new Date("2025-04-03"),
    itemDescription: "Packaging Materials",
    rate: 3200,
    qty: 50,
    amount: 160000,
    transporterName: "AllCargo Express",
    paidOrToPay: "Paid",
    bookingType: "Priority",
    paymentDetails: "NEFT Payment",
    createdBy: "admin-seed",
    createdAt: new Date("2025-04-03"),
    updatedAt: new Date("2025-04-03"),
  },
  {
    companyName: "Quantum Industries",
    contactPerson: "Mr. Vikram",
    contactNo: "9234567890",
    email: "vikram@quantum.com",
    orderRef: "QI-2025-234",
    destination: "Chennai",
    invoiceNo: "7",
    invDate: new Date("2025-04-03"),
    itemDescription: "Industrial Equipment",
    rate: 25000,
    qty: 3,
    amount: 75000,
    transporterName: "FedEx India",
    paidOrToPay: "To Pay",
    bookingType: "Express",
    paymentDetails: "Credit Term 30 Days",
    createdBy: "admin-seed",
    createdAt: new Date("2025-04-03"),
    updatedAt: new Date("2025-04-03"),
  },
  {
    companyName: "Premium Traders",
    contactPerson: "Ms. Sarah",
    contactNo: "9345678901",
    email: "sarah@premiumtraders.com",
    orderRef: "PT-2025-089",
    destination: "Hyderabad",
    invoiceNo: "8",
    invDate: new Date("2025-04-04"),
    itemDescription: "Consumer Goods",
    rate: 4500,
    qty: 10,
    amount: 45000,
    transporterName: "DTDC Courier",
    paidOrToPay: "Paid",
    bookingType: "Standard",
    paymentDetails: "100% Advance Received",
    createdBy: "admin-seed",
    createdAt: new Date("2025-04-04"),
    updatedAt: new Date("2025-04-04"),
  },
]

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db("order-dispatch")

    console.log("Clearing existing orders...")
    await db.collection("orders").deleteMany({ createdBy: "admin-seed" })

    console.log("Inserting sample orders...")
    const result = await db.collection("orders").insertMany(SAMPLE_ORDERS)

    console.log(`✓ Successfully inserted ${result.insertedIds.length} sample orders`)

    // Verify insertion
    const count = await db.collection("orders").countDocuments({ createdBy: "admin-seed" })
    console.log(`✓ Total orders in database: ${count}`)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seedDatabase()
