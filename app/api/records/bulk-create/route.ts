import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import type { Record } from "@/lib/db-utils";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { records } = await request.json();

        if (!records || !Array.isArray(records) || records.length === 0) {
            return NextResponse.json(
                { error: "No records provided" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        // Add metadata to each record
        const recordsWithMetadata: Record[] = records.map((record: any) => ({
            ...record,
            createdBy: user.userId as string,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        const result = await db
            .collection("records")
            .insertMany(recordsWithMetadata);

        return NextResponse.json(
            {
                success: true,
                count: result.insertedCount,
                recordIds: Object.values(result.insertedIds),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Bulk record creation error:", error);
        return NextResponse.json(
            { error: "Failed to create records" },
            { status: 500 }
        );
    }
}
