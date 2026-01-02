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

        const body = await request.json();
        const { page = 1, limit = 20, all = false, ...filters } = body;

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        const query: any = {};

        if (filters.company) {
            query.companyName = { $regex: filters.company, $options: "i" };
        }
        if (filters.contactPerson) {
            query.contactPerson = {
                $regex: filters.contactPerson,
                $options: "i",
            };
        }
        if (filters.contactNo) {
            query.contactNo = { $regex: filters.contactNo, $options: "i" };
        }
        if (filters.email) {
            query.email = { $regex: filters.email, $options: "i" };
        }
        if (filters.recordRef) {
            query.recordRef = { $regex: filters.recordRef, $options: "i" };
        }
        if (filters.city) {
            query.city = { $regex: filters.city, $options: "i" };
        }
        if (filters.district) {
            query.district = { $regex: filters.district, $options: "i" };
        }
        if (filters.state) {
            query.state = { $regex: filters.state, $options: "i" };
        }
        if (filters.country) {
            query.country = { $regex: filters.country, $options: "i" };
        }
        if (filters.invoiceNo) {
            query.invoiceNo = { $regex: filters.invoiceNo, $options: "i" };
        }
        if (filters.itemCategory) {
            query.itemCategory = {
                $regex: filters.itemCategory,
                $options: "i",
            };
        }
        if (filters.itemSubcategory) {
            query.itemSubcategory = {
                $regex: filters.itemSubcategory,
                $options: "i",
            };
        }
        if (filters.transporter) {
            query.transporterName = {
                $regex: filters.transporter,
                $options: "i",
            };
        }
        if (filters.bookingType) {
            query.bookingType = { $regex: filters.bookingType, $options: "i" };
        }
        if (filters.paidOrToPay) {
            query.paidOrToPay = { $regex: filters.paidOrToPay, $options: "i" };
        }
        if (filters.paymentDetails) {
            query.paymentDetails = {
                $regex: filters.paymentDetails,
                $options: "i",
            };
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

        // Get total count
        const total = await db.collection("records").countDocuments(query);

        let records;
        if (all) {
            // For downloads - get all records
            records = await db
                .collection("records")
                .find(query)
                .sort({ createdAt: -1 })
                .toArray();
        } else {
            // Paginated results
            const skip = (page - 1) * limit;
            records = await db
                .collection("records")
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();
        }

        return NextResponse.json({
            records,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Filter error:", error);
        return NextResponse.json(
            { error: "Failed to filter records" },
            { status: 500 }
        );
    }
}
