import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo"); // "candidato", "mentor" ou null para ambos
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  const conn = await pool.getConnection();
  try {
    let whereClause = "";
    const params: any[] = [];

    if (tipo === "candidato" || tipo === "mentor") {
      whereClause = "WHERE tipo = ?";
      params.push(tipo);
    }

    // Total de registros
    const [countRows] = await conn.execute<any[]>(
      `SELECT COUNT(*) as total FROM mentorconnect_usuarios ${whereClause}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    // Dados paginados
    const [rows] = await conn.execute<any[]>(
      `SELECT usuario_id, email, nome, sobrenome, tipo, foto_perfil, cidade, estado, pais, bio_descricao, sincronizado_em
       FROM mentorconnect_usuarios
       ${whereClause}
       ORDER BY sincronizado_em DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

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
    // Tabela ainda não criada (nenhum usuário sincronizado ainda)
    if (err.code === "ER_NO_SUCH_TABLE") {
      return NextResponse.json({
        data: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
        message: "Nenhum usuário sincronizado ainda.",
      });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    conn.release();
  }
}
