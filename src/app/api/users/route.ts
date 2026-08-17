import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedSyncRequest } from "@/lib/sync-auth";

export async function GET(req: NextRequest) {
  if (!isAuthorizedSyncRequest(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  try {
    const whereClause: any = {};

    if (tipo === "candidato" || tipo === "mentor") {
      whereClause.tipo = tipo;
    }

    const total = await prisma.mentorconnect_usuario.count({ where: whereClause });

    const rows = await prisma.mentorconnect_usuario.findMany({
      where: whereClause,
      orderBy: { sincronizado_em: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        usuario_id: true,
        email: true,
        nome: true,
        sobrenome: true,
        tipo: true,
        foto_perfil: true,
        cidade: true,
        estado: true,
        pais: true,
        bio_descricao: true,
        sincronizado_em: true,
        atualizado_em: true,
      },
    });

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    if (err.code === "P2021") {
      return NextResponse.json({
        data: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
        message: "Nenhum usuário sincronizado ainda.",
      });
    }
    console.error("Erro na busca de usuários:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
