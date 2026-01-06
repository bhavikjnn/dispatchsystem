import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyPassword, createToken, isWithinAllowedHours } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Missing email or password" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        const user = await db.collection("users").findOne({ email });
        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        console.log("User found in DB:", {
            id: user._id,
            email: user.email,
            role: user.role,
        });

        console.log("User found in DB:", {
            id: user._id,
            email: user.email,
            role: user.role,
        });

        const passwordValid = await verifyPassword(password, user.password);
        if (!passwordValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check if employee is logging in within allowed hours (global setting)
        if (user.role === "employee") {
            const settings = await db.collection("settings").findOne({
                _id: "global",
            });

            const allowedHours = settings?.employeeLoginHours;
            if (!isWithinAllowedHours(allowedHours)) {
                const startTime = allowedHours?.startTime || "N/A";
                const endTime = allowedHours?.endTime || "N/A";

                // Log the blocked login attempt
                await db.collection("login_attempts").insertOne({
                    userId: user._id,
                    email: user.email,
                    name: user.name,
                    attemptTime: new Date(),
                    status: "blocked",
                    reason: "outside_allowed_hours",
                    allowedHours: {
                        startTime,
                        endTime,
                    },
                    ipAddress:
                        request.headers.get("x-forwarded-for") ||
                        request.headers.get("x-real-ip") ||
                        "unknown",
                });

                return NextResponse.json(
                    {
                        error: `Login is only allowed between ${startTime} and ${endTime}. Please contact your administrator.`,
                        code: "OUTSIDE_ALLOWED_HOURS",
                    },
                    { status: 403 }
                );
            }
        }

        const token = await createToken(user._id.toString(), email, user.role);
        console.log("Token created for role:", user.role);
        console.log("Token created for role:", user.role);

        const cookieStore = await cookies();
        cookieStore.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
