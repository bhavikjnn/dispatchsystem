import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

// GET global settings
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

        const settings = await db.collection("settings").findOne({
            _id: "global",
        });

        return NextResponse.json({
            settings: settings || {
                employeeLoginHours: {
                    enabled: false,
                    startTime: "09:00",
                    endTime: "17:00",
                },
            },
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH update global settings
export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { employeeLoginHours } = await request.json();

        // Validate time format
        if (employeeLoginHours?.enabled) {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (
                !timeRegex.test(employeeLoginHours.startTime) ||
                !timeRegex.test(employeeLoginHours.endTime)
            ) {
                return NextResponse.json(
                    {
                        error: "Invalid time format. Use HH:MM (24-hour format)",
                    },
                    { status: 400 }
                );
            }
        }

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        await db.collection("settings").updateOne(
            { _id: "global" },
            {
                $set: {
                    employeeLoginHours,
                    updatedAt: new Date(),
                },
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            message: "Login hours updated successfully",
        });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
