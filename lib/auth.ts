import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { jwtVerify, CompactSign } from "jose";

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
    // Token expires in 30 minutes
    const payload = new TextEncoder().encode(
        JSON.stringify({
            userId,
            email,
            role,
            exp: Math.floor(Date.now() / 1000) + 60 * 30,
        })
    );
    const protectedHeader = { alg: "HS256", typ: "JWT" };
    const jwt = await new CompactSign(payload)
        .setProtectedHeader(protectedHeader)
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
    // Normalize payload (handle jose returning payload as Uint8Array or object)
    let user: any = payload;
    if (typeof payload === "object" && !("userId" in payload)) {
        // jose may return { payload: { ... } }
        user = (payload as any).payload || payload;
    }
    // If still not normalized, try to parse if it's a string
    if (user && typeof user === "string") {
        try {
            user = JSON.parse(user);
        } catch {}
    }
    // Return only the expected fields
    if (user && user.userId && user.email && user.role) {
        return {
            userId: user.userId,
            email: user.email,
            role: user.role,
        };
    }
    return null;
}
