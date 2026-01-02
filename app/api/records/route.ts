import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import type { Record } from "@/lib/db-utils";
import { getOrCreateFieldVisibility } from "@/lib/db-utils";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const data = await request.json();

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        const record: Record = {
            ...data,
            createdBy: user.userId as string,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection("records").insertOne(record);

        return NextResponse.json(
            { success: true, recordId: result.insertedId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Record creation error:", error);
        return NextResponse.json(
            { error: "Failed to create record" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const all = searchParams.get("all") === "true"; // For downloads

        // Filter params
        const company = searchParams.get("company") || "";
        const contactPerson = searchParams.get("contactPerson") || "";
        const contactNo = searchParams.get("contactNo") || "";
        const email = searchParams.get("email") || "";
        const recordRef = searchParams.get("recordRef") || "";
        const city = searchParams.get("city") || "";
        const district = searchParams.get("district") || "";
        const state = searchParams.get("state") || "";
        const country = searchParams.get("country") || "";
        const invoiceNo = searchParams.get("invoiceNo") || "";
        const itemCategory = searchParams.get("itemCategory") || "";
        const itemSubcategory = searchParams.get("itemSubcategory") || "";
        const transporter = searchParams.get("transporter") || "";
        const bookingType = searchParams.get("bookingType") || "";
        const paidOrToPay = searchParams.get("paidOrToPay") || "";
        const paymentDetails = searchParams.get("paymentDetails") || "";
        const year = searchParams.get("year") || "";
        const startDate = searchParams.get("startDate") || "";
        const endDate = searchParams.get("endDate") || "";

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        const visibility = await getOrCreateFieldVisibility();

        const query: any = {};

        if (user.role === "employee") {
            query.createdBy = user.userId;
        }

        // Apply filters to query
        if (company) {
            query.companyName = { $regex: company, $options: "i" };
        }
        if (contactPerson) {
            query.contactPerson = { $regex: contactPerson, $options: "i" };
        }
        if (contactNo) {
            query.contactNo = { $regex: contactNo, $options: "i" };
        }
        if (email) {
            query.email = { $regex: email, $options: "i" };
        }
        if (recordRef) {
            query.recordRef = { $regex: recordRef, $options: "i" };
        }
        if (city) {
            query.city = { $regex: city, $options: "i" };
        }
        if (district) {
            query.district = { $regex: district, $options: "i" };
        }
        if (state) {
            query.state = { $regex: state, $options: "i" };
        }
        if (country) {
            query.country = { $regex: country, $options: "i" };
        }
        if (invoiceNo) {
            query.invoiceNo = { $regex: invoiceNo, $options: "i" };
        }
        if (itemCategory) {
            query.itemCategory = { $regex: itemCategory, $options: "i" };
        }
        if (itemSubcategory) {
            query.itemSubcategory = { $regex: itemSubcategory, $options: "i" };
        }
        if (transporter) {
            query.transporterName = { $regex: transporter, $options: "i" };
        }
        if (bookingType) {
            query.bookingType = { $regex: bookingType, $options: "i" };
        }
        if (paidOrToPay) {
            query.paidOrToPay = { $regex: paidOrToPay, $options: "i" };
        }
        if (paymentDetails) {
            query.paymentDetails = { $regex: paymentDetails, $options: "i" };
        }
        if (year) {
            // Filter by year
            const yearStart = new Date(`${year}-01-01`);
            const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);
            query.invDate = { $gte: yearStart, $lte: yearEnd };
        } else if (startDate || endDate) {
            query.invDate = {};
            if (startDate) {
                query.invDate.$gte = new Date(startDate);
            }
            if (endDate) {
                query.invDate.$lte = new Date(endDate);
            }
        }

        // Get total count of filtered results
        const total = await db.collection("records").countDocuments(query);

        let records;
        if (all) {
            // For downloads - get all filtered records
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

        // Filter fields based on visibility
        const filteredRecords = records.map((record) => {
            const filtered: any = {};
            Object.entries(visibility.fields).forEach(([field, visible]) => {
                if (visible) {
                    filtered[field] = record[field];
                }
            });
            filtered._id = record._id;
            return filtered;
        });

        return NextResponse.json({
            records: filteredRecords,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching records:", error);
        return NextResponse.json(
            { error: "Failed to fetch records" },
            { status: 500 }
        );
    }
}
