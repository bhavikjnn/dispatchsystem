import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface User {
    _id: string;
    email: string;
    password: string;
    name: string;
    role: "admin" | "employee";
    createdAt: Date;
}

export async function hashPassword(password: string): Promise<string> {
    return hash(password, 10);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return compare(password, hash);
}

export async function createToken(
    userId: string,
    email: string,
    role: string
): Promise<string> {
    const jwt = await new SignJWT({ userId, email, role })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(JWT_SECRET);
    return jwt;
}

export async function verifyToken(token: string) {
    try {
        const verified = await jwtVerify(token, JWT_SECRET);
        return verified.payload;
    } catch {
        return null;
    }
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    // Return only the expected fields
    if (payload && payload.userId && payload.email && payload.role) {
        return {
            userId: payload.userId as string,
            email: payload.email as string,
            role: payload.role as string,
        };
    }

    return null;
}
