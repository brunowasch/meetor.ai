import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const { bio, expertise } = await req.json();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        bio: bio || null,
        expertise: expertise || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[mentor profile PATCH]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
