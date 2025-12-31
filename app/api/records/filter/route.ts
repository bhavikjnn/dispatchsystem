import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const filters = await request.json();

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        const query: any = {};

        if (filters.company) {
            query.companyName = { $regex: filters.company, $options: "i" };
        }

        if (filters.city) {
            query.city = { $regex: filters.city, $options: "i" };
        }

        if (filters.state) {
            query.state = { $regex: filters.state, $options: "i" };
        }

        if (filters.country) {
            query.country = { $regex: filters.country, $options: "i" };
        }

        if (filters.transporter) {
            query.transporterName = {
                $regex: filters.transporter,
                $options: "i",
            };
        }

        if (filters.bookingType) {
            query.bookingType = filters.bookingType;
        }

        if (filters.paidOrToPay) {
            query.paidOrToPay = filters.paidOrToPay;
        }

        if (filters.startDate || filters.endDate) {
            query.invDate = {};
            if (filters.startDate) {
                query.invDate.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                query.invDate.$lte = new Date(filters.endDate);
            }
        }

        const records = await db
            .collection("records")
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ records });
    } catch (error) {
        console.error("Filter error:", error);
        return NextResponse.json(
            { error: "Failed to filter records" },
            { status: 500 }
        );
    }
}
