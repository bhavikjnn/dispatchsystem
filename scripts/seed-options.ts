import clientPromise from "../lib/mongodb";
import { ITEM_CATEGORIES } from "../lib/item-descriptions";

async function seedOptions() {
    try {
        const client = await clientPromise;
        const db = client.db("order-dispatch");

        // Seed item categories
        const categories = Object.keys(ITEM_CATEGORIES);
        await db.collection("options").updateOne(
            { type: "itemCategory" },
            {
                $set: {
                    values: categories,
                    updatedAt: new Date(),
                },
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
        );

        // Seed item subcategories for each category
        for (const [category, subcategories] of Object.entries(
            ITEM_CATEGORIES
        )) {
            await db.collection("options").updateOne(
                { type: `itemSubcategory_${category}` },
                {
                    $set: {
                        values: subcategories,
                        updatedAt: new Date(),
                    },
                    $setOnInsert: { createdAt: new Date() },
                },
                { upsert: true }
            );
        }

        console.log("Options seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding options:", error);
        process.exit(1);
    }
}

seedOptions();
