import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

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

        // First try to get companies from options collection
        const companiesDoc = await db
            .collection("options")
            .findOne({ type: "company" });
        let companies = companiesDoc?.values || [];

        // If no companies in options, get from records and seed options
        if (companies.length === 0) {
            const distinctCompanies = await db
                .collection("records")
                .distinct("companyName");
            companies = distinctCompanies.filter(Boolean).sort();

            // Seed options collection if we found companies
            if (companies.length > 0) {
                await db.collection("options").updateOne(
                    { type: "company" },
                    {
                        $set: {
                            values: companies,
                            updatedAt: new Date(),
                        },
                        $setOnInsert: { createdAt: new Date() },
                    },
                    { upsert: true }
                );
            }
        }

        // Get other distinct values for filter dropdowns (admin only)
        if (user.role === "admin") {
            const [cities, states, countries, transporters, bookingTypes] =
                await Promise.all([
                    db.collection("records").distinct("city"),
                    db.collection("records").distinct("state"),
                    db.collection("records").distinct("country"),
                    db.collection("records").distinct("transporterName"),
                    db.collection("records").distinct("bookingType"),
                ]);

            return NextResponse.json({
                companies,
                cities: cities.filter(Boolean).sort(),
                states: states.filter(Boolean).sort(),
                countries: countries.filter(Boolean).sort(),
                transporters: transporters.filter(Boolean).sort(),
                bookingTypes: bookingTypes.filter(Boolean).sort(),
            });
        }

        // For employees, just return companies
        return NextResponse.json({
            companies,
        });
    } catch (error) {
        console.error("Filter options error:", error);
        return NextResponse.json(
            { error: "Failed to fetch filter options" },
            { status: 500 }
        );
    }
}
