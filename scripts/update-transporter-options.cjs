const { MongoClient } = require("mongodb");

const TRANSPORTER_OPTIONS = [
    "New Kaushik Transport",
    "New Haryana Punjab Transport",
    "Haryana Punjab Transport",
    "V-Trans India",
    "TCI EXPRESS",
    "TCI Freight",
    "ATC Logistics",
    "Shivans Logistics",
    "Self Pickup",
    "DTDC",
    "OM Logistics",
    "Accurate Transport",
];

async function updateTransporterOptions() {
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
        await db.collection("options").updateOne(
            { type: "transporter" },
            {
                $set: {
                    values: TRANSPORTER_OPTIONS,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            { upsert: true },
        );

        console.log("Transporter options updated successfully.");
    } finally {
        await client.close();
    }
}

updateTransporterOptions().catch((error) => {
    console.error("Failed to update transporter options:", error);
    process.exit(1);
});
