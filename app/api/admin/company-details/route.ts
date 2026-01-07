import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "company_details";

interface CompanyDetailsData {
    _id?: string;
    companyName: string;
    folderNumber: number;
    fileNumber: number;
}

// GET - Fetch all company details
export async function GET(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection(COLLECTION_NAME);

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const data = await collection
            .find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await collection.countDocuments({});

        return NextResponse.json(
            {
                data,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
                message: "Company details fetched successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching company details:", error);
        return NextResponse.json(
            { error: "Failed to fetch company details" },
            { status: 500 }
        );
    }
}

// POST - Create company details
export async function POST(request: NextRequest) {
    try {
        const body: CompanyDetailsData = await request.json();

        // Validate required fields
        if (
            !body.companyName ||
            body.folderNumber === undefined ||
            body.fileNumber === undefined
        ) {
            return NextResponse.json(
                {
                    error: "Missing required fields: companyName, folderNumber, fileNumber",
                },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection(COLLECTION_NAME);

        const result = await collection.insertOne({
            companyName: body.companyName,
            folderNumber: body.folderNumber,
            fileNumber: body.fileNumber,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const inserted = await collection.findOne({
            _id: result.insertedId,
        });

        return NextResponse.json(
            { data: inserted, message: "Company details created successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating company details:", error);
        return NextResponse.json(
            { error: "Failed to create company details" },
            { status: 500 }
        );
    }
}

// PUT - Update company details by ID
export async function PUT(request: NextRequest) {
    try {
        const body: CompanyDetailsData = await request.json();

        // Validate required fields
        if (
            !body._id ||
            !body.companyName ||
            body.folderNumber === undefined ||
            body.fileNumber === undefined
        ) {
            return NextResponse.json(
                {
                    error: "Missing required fields: _id, companyName, folderNumber, fileNumber",
                },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection(COLLECTION_NAME);

        const result = await collection.updateOne(
            { _id: new ObjectId(body._id) },
            {
                $set: {
                    companyName: body.companyName,
                    folderNumber: body.folderNumber,
                    fileNumber: body.fileNumber,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: "Company details not found" },
                { status: 404 }
            );
        }

        const updated = await collection.findOne({
            _id: new ObjectId(body._id),
        });

        return NextResponse.json(
            { data: updated, message: "Company details updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating company details:", error);
        return NextResponse.json(
            { error: "Failed to update company details" },
            { status: 500 }
        );
    }
}

// DELETE - Delete company details by ID
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID parameter is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection(COLLECTION_NAME);

        const result = await collection.deleteOne({
            _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: "Company details not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Company details deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting company details:", error);
        return NextResponse.json(
            { error: "Failed to delete company details" },
            { status: 500 }
        );
    }
}
