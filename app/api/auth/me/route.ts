import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("order-dispatch")

    const userData = await db
      .collection("users")
      .findOne({ _id: require("mongodb").ObjectId.createFromHexString(user.userId as string) })

    return NextResponse.json({
      user: {
        id: userData?._id,
        email: userData?.email,
        name: userData?.name,
        role: userData?.role,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
