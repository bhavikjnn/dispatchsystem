import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ITEM_CATEGORIES, ITEM_CATEGORY_LIST } from "@/lib/item-descriptions";

// Auto-seed if empty
async function ensureSeeded(db: any) {
    const count = await db.collection("options").countDocuments();
    console.log(`[Options API] Current options count: ${count}`);

    if (count === 0) {
        console.log(
            "[Options API] Collection is empty, seeding initial options..."
        );

        // Seed item categories
        await db.collection("options").insertOne({
            type: "itemCategory",
            values: ITEM_CATEGORY_LIST,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log(
            `[Options API] Seeded ${ITEM_CATEGORY_LIST.length} item categories`
        );

        // Seed item subcategories for each category
        for (const [category, subcategories] of Object.entries(
            ITEM_CATEGORIES
        )) {
            await db.collection("options").insertOne({
                type: `itemSubcategory_${category}`,
                values: subcategories,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(
                `[Options API] Seeded ${subcategories.length} subcategories for ${category}`
            );
        }

        console.log("[Options API] Initial options seeded successfully!");
    } else {
        console.log("[Options API] Options already exist, skipping seed");
    }
}

// GET - Fetch all options
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
        const type = searchParams.get("type");

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        // Ensure data is seeded
        await ensureSeeded(db);

        if (type) {
            // Get specific option type
            const optionDoc = await db.collection("options").findOne({ type });

            // Fallback to hardcoded lists if not in DB
            let values = optionDoc?.values || [];
            if (values.length === 0) {
                if (type === "itemCategory") {
                    values = ITEM_CATEGORY_LIST;
                } else if (type.startsWith("itemSubcategory_")) {
                    const category = type.replace("itemSubcategory_", "");
                    values =
                        ITEM_CATEGORIES[
                            category as keyof typeof ITEM_CATEGORIES
                        ] || [];
                } else if (type === "company") {
                    // Get companies from records if not in options
                    const distinctCompanies = await db
                        .collection("records")
                        .distinct("companyName");
                    values = distinctCompanies.filter(Boolean).sort();
                }
            }

            return NextResponse.json({ options: values });
        }

        // Get all options
        const allOptions = await db.collection("options").find({}).toArray();
        const optionsMap: Record<string, string[]> = {};
        allOptions.forEach((doc) => {
            optionsMap[doc.type] = doc.values || [];
        });

        return NextResponse.json({ options: optionsMap });
    } catch (error) {
        console.error("Error fetching options:", error);
        return NextResponse.json(
            { error: "Failed to fetch options" },
            { status: 500 }
        );
    }
}

// POST - Add new option
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { type, value } = await request.json();

        if (!type || !value) {
            return NextResponse.json(
                { error: "Type and value are required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("order-dispatch");

        // Add value to the array if it doesn't exist
        const result = await db.collection("options").updateOne(
            { type },
            {
                $addToSet: { values: value },
                $setOnInsert: { createdAt: new Date() },
                $set: { updatedAt: new Date() },
            },
            { upsert: true }
        );

        console.log(`[Options API] Added "${value}" to ${type} options`);

        return NextResponse.json({
            success: true,
            modified: result.modifiedCount > 0 || result.upsertedCount > 0,
        });
    } catch (error) {
        console.error("Error adding option:", error);
        return NextResponse.json(
            { error: "Failed to add option" },
            { status: 500 }
        );
    }
}
