import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { getOrCreateFieldVisibility } from "@/lib/db-utils";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Both admin and employee can read visibility settings
        const visibility = await getOrCreateFieldVisibility();
        return NextResponse.json({ visibility });
    } catch (error) {
        console.error("Error fetching visibility:", error);
        return NextResponse.json(
            { error: "Failed to fetch visibility settings" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { fields } = await request.json();

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        const result = await db.collection("field-visibility").updateOne(
            {},
            {
                $set: {
                    fields,
                    updatedAt: new Date(),
                },
            },
            { upsert: true }
        );

        const updated = await getOrCreateFieldVisibility();
        return NextResponse.json({ visibility: updated, success: true });
    } catch (error) {
        console.error("Error updating visibility:", error);
        return NextResponse.json(
            { error: "Failed to update visibility settings" },
            { status: 500 }
        );
    }
}
