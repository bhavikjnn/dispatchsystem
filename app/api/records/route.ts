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

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        const visibility = await getOrCreateFieldVisibility();

        const query: any = {};

        if (user.role === "employee") {
            query.createdBy = user.userId;
        }

        const records = await db
            .collection("records")
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

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

        return NextResponse.json({ records: filteredRecords });
    } catch (error) {
        console.error("Error fetching records:", error);
        return NextResponse.json(
            { error: "Failed to fetch records" },
            { status: 500 }
        );
    }
}
