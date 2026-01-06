import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "100");
        const status = searchParams.get("status"); // "blocked" or "all"

        const query: any = {};
        if (status === "blocked") {
            query.status = "blocked";
        }

        const attempts = await db
            .collection("login_attempts")
            .find(query)
            .sort({ attemptTime: -1 })
            .limit(limit)
            .toArray();

        return NextResponse.json({ attempts });
    } catch (error) {
        console.error("Error fetching login attempts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Clear old login attempts
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get("days") || "30");

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await db.collection("login_attempts").deleteMany({
            attemptTime: { $lt: cutoffDate },
        });

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `Deleted ${result.deletedCount} login attempts older than ${days} days`,
        });
    } catch (error) {
        console.error("Error deleting login attempts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
