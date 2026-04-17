const { MongoClient } = require("mongodb");

async function updateCompanyOptionsFromRecords() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable is not set");
    }

    const client = new MongoClient(process.env.MONGODB_URI, {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        retryReads: true,
    });

    await client.connect();

    try {
        const db = client.db("order-dispatch");
        const distinctCompanies = await db
            .collection("records")
            .distinct("companyName");

        const values = [...new Set(
            distinctCompanies
                .filter((value) => typeof value === "string")
                .map((value) => value.trim())
                .filter(Boolean),
        )].sort((a, b) => a.localeCompare(b));

        await db.collection("options").updateOne(
            { type: "company" },
            {
                $set: {
                    values,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            { upsert: true },
        );

        console.log(`Company options updated successfully. Total: ${values.length}`);
    } finally {
        await client.close();
    }
}

updateCompanyOptionsFromRecords().catch((error) => {
    console.error("Failed to update company options:", error);
    process.exit(1);
});
