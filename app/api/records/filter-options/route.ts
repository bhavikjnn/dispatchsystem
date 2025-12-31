import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        // Get distinct values for filter dropdowns
        const [
            companies,
            cities,
            states,
            countries,
            transporters,
            bookingTypes,
        ] = await Promise.all([
            db.collection("records").distinct("companyName"),
            db.collection("records").distinct("city"),
            db.collection("records").distinct("state"),
            db.collection("records").distinct("country"),
            db.collection("records").distinct("transporterName"),
            db.collection("records").distinct("bookingType"),
        ]);

        return NextResponse.json({
            companies: companies.filter(Boolean).sort(),
            cities: cities.filter(Boolean).sort(),
            states: states.filter(Boolean).sort(),
            countries: countries.filter(Boolean).sort(),
            transporters: transporters.filter(Boolean).sort(),
            bookingTypes: bookingTypes.filter(Boolean).sort(),
        });
    } catch (error) {
        console.error("Filter options error:", error);
        return NextResponse.json(
            { error: "Failed to fetch filter options" },
            { status: 500 }
        );
    }
}
