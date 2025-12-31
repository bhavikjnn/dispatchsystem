/**
 * Migration Script: Orders to Records
 *
 * This script migrates the database from the old "orders" structure to the new "records" structure
 * Changes:
 * 1. Renames "orders" collection to "records"
 * 2. Splits "destination" field into city, district, state, country
 * 3. Renames "orderRef" to "recordRef"
 * 4. Updates field visibility configuration
 */

import clientPromise from "../lib/mongodb";

async function migrateOrdersToRecords() {
    console.log("🚀 Starting migration from orders to records...");

    try {
        const client = await clientPromise;
        const db = client.db("order-dispatch");

        // Check if orders collection exists
        const collections = await db
            .listCollections({ name: "orders" })
            .toArray();

        if (collections.length === 0) {
            console.log(
                "✅ No 'orders' collection found. Migration not needed."
            );
            return;
        }

        console.log("📊 Found 'orders' collection. Starting migration...");

        // Get all orders
        const orders = await db.collection("orders").find({}).toArray();
        console.log(`📝 Found ${orders.length} orders to migrate`);

        // Transform orders to records
        const records = orders.map((order) => {
            // Parse destination into location components
            // Assuming destination format like "Delhi" or "Mumbai, Maharashtra"
            const destination = order.destination || "";
            const parts = destination.split(",").map((p: string) => p.trim());

            let city = "";
            let district = "";
            let state = "";
            let country = "India"; // Default

            if (parts.length === 1) {
                city = parts[0];
            } else if (parts.length === 2) {
                city = parts[0];
                state = parts[1];
            } else if (parts.length >= 3) {
                city = parts[0];
                district = parts[1];
                state = parts[2];
            }

            return {
                ...order,
                recordRef: order.orderRef || order.orderRef,
                city,
                district,
                state,
                country,
                // Remove old fields
                orderRef: undefined,
                destination: undefined,
            };
        });

        // Create records collection if it doesn't exist
        await db.createCollection("records").catch(() => {
            console.log("ℹ️  Records collection already exists");
        });

        // Insert records
        if (records.length > 0) {
            await db.collection("records").insertMany(records);
            console.log(`✅ Migrated ${records.length} records successfully`);
        }

        // Create indexes for new fields
        await db.collection("records").createIndex({ createdAt: -1 });
        await db.collection("records").createIndex({ companyName: 1 });
        await db.collection("records").createIndex({ city: 1 });
        await db.collection("records").createIndex({ state: 1 });
        await db.collection("records").createIndex({ country: 1 });
        console.log("✅ Created indexes for records collection");

        // Update field visibility
        const visibility = await db.collection("field-visibility").findOne({});
        if (visibility) {
            const updatedFields = {
                ...visibility.fields,
                recordRef:
                    visibility.fields.orderRef !== undefined
                        ? visibility.fields.orderRef
                        : true,
                city: true,
                district: true,
                state: true,
                country: true,
                // Remove old fields
                orderRef: undefined,
                destination: undefined,
            };

            await db.collection("field-visibility").updateOne(
                { _id: visibility._id },
                {
                    $set: {
                        fields: updatedFields,
                        updatedAt: new Date(),
                    },
                }
            );
            console.log("✅ Updated field visibility configuration");
        }

        // Rename old collection to backup
        await db.collection("orders").rename("orders_backup");
        console.log("✅ Renamed 'orders' collection to 'orders_backup'");

        console.log("\n🎉 Migration completed successfully!");
        console.log("\n📋 Summary:");
        console.log(`   - Migrated ${records.length} records`);
        console.log(`   - Created new indexes`);
        console.log(`   - Updated field visibility`);
        console.log(`   - Backed up old collection as 'orders_backup'`);
        console.log(
            "\n⚠️  Note: You can delete 'orders_backup' collection after verifying the migration"
        );
    } catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    }
}

// Run migration
migrateOrdersToRecords()
    .then(() => {
        console.log("\n✅ Migration script completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Migration script failed:", error);
        process.exit(1);
    });
