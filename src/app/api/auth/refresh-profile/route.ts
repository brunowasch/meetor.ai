import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  try {
    const usuario = await prisma.mentorconnect_usuario.findFirst({
      where: { email },
    });

    if (!usuario) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({
      exists: true,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      foto_perfil: usuario.foto_perfil,
      tipo: usuario.tipo,
    });
  } catch (e) {
    console.error("[refresh-profile] Erro ao buscar perfil localmente:", e);
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}
