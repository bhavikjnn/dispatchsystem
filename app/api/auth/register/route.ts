import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { hashPassword, createToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (role !== "admin" && role !== "employee") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("order-dispatch")

    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date(),
    })

    const token = await createToken(result.insertedId.toString(), email, role)

    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    return NextResponse.json({ success: true, userId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
