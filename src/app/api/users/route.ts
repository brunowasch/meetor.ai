import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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
