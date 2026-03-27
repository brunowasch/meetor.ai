import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: "MENTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        expertise: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ mentors });
  } catch (err) {
    console.error("[mentors GET]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
