import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "mentorship-secret-key-2024";

export function signToken(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userId, timestamp, sig] = decoded.split(".");
    const payload = `${userId}.${timestamp}`;
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex");
    if (sig !== expected) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const userId = verifyToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      expertise: true,
    },
  });

  return user;
}

export function generateMeetingToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
