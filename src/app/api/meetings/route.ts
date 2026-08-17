import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedSyncRequest } from "@/lib/sync-auth";

const APP_ID = process.env.APP_ID;

export async function POST(req: NextRequest) {
  if (!isAuthorizedSyncRequest(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { usuario_id, titulo } = body as { usuario_id?: string; titulo?: string };

    if (!usuario_id || typeof usuario_id !== "string" || !usuario_id.trim()) {
      return NextResponse.json(
        { error: "O campo 'usuario_id' é obrigatório." },
        { status: 400 }
      );
    }

    const usuario = await prisma.mentorconnect_usuario.findUnique({
      where: { usuario_id: usuario_id.trim() },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: `Usuário com usuario_id '${usuario_id}' não encontrado.` },
        { status: 404 }
      );
    }

    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const token = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `http://${req.headers.get("host") || "localhost:3001"}`;

    const link = `${baseUrl.replace(/\/$/, "")}/meeting/${token}`;

    const reuniao = await prisma.mentorconnect_reuniao.create({
      data: {
        token,
        titulo: titulo?.trim() ?? null,
        criado_por: usuario_id.trim(),
        status: "ativa",
        link,
      },
    });

    return NextResponse.json(
      {
        id: reuniao.id,
        token: reuniao.token,
        link: reuniao.link,
        jitsi_room: `${APP_ID}/MentorshipConnect-Room-${token}`,
        titulo: reuniao.titulo,
        status: reuniao.status,
        criado_em: reuniao.criado_em,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/meetings] Erro:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedSyncRequest(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get("usuario_id");

  if (!usuario_id) {
    return NextResponse.json({ error: "Parâmetro 'usuario_id' é obrigatório." }, { status: 400 });
  }

  try {
    const reunioes = await prisma.mentorconnect_reuniao.findMany({
      where: { criado_por: usuario_id },
      orderBy: { criado_em: "desc" },
    });

    return NextResponse.json({ reunioes });
  } catch (err) {
    console.error("[GET /api/meetings] Erro:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
