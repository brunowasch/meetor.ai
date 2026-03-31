import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  const connectSkillsUrl = process.env.CONNECT_SKILLS_URL || "http://localhost:3000";

  try {
    const res = await fetch(
      `${connectSkillsUrl}/api/user/status?email=${encodeURIComponent(email)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[refresh-profile] Erro ao buscar perfil no Connect Skills:", e);
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}
