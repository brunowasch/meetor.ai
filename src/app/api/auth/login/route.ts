import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      const [usuarios] = await conn.execute<any[]>(
        "SELECT id, email, senha, tipo, nome, sobrenome FROM usuario WHERE email = ?",
        [email]
      );

      if (usuarios.length === 0) {
        return NextResponse.json({ error: "Credenciais inválidas ou usuário não encontrado." }, { status: 401 });
      }

      const usuario = usuarios[0];

      // 2. Verificar senha
      const isPasswordValid = await bcrypt.compare(password, usuario.senha);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
      }

      // 3. Buscar nome do perfil real (tabela candidato ou mentor)
      const tipo = (usuario.tipo || "").toLowerCase();
      let nomeDisplay = usuario.nome;
      let sobrenomeDisplay = usuario.sobrenome;
      let fotoPerfil: string | null = null;

      try {
        if (tipo === "candidato") {
          const [rows] = await conn.execute<any[]>(
            "SELECT nome, sobrenome, foto_perfil FROM candidato WHERE usuario_id = ?",
            [usuario.id]
          );
          if (rows.length) {
            nomeDisplay = rows[0].nome || nomeDisplay;
            sobrenomeDisplay = rows[0].sobrenome || sobrenomeDisplay;
            fotoPerfil = rows[0].foto_perfil || null;
          }
        } else if (tipo === "mentor") {
          const [rows] = await conn.execute<any[]>(
            "SELECT nome, sobrenome, foto_perfil FROM mentor WHERE usuario_id = ?",
            [usuario.id]
          );
          if (rows.length) {
            nomeDisplay = rows[0].nome || nomeDisplay;
            sobrenomeDisplay = rows[0].sobrenome || sobrenomeDisplay;
            fotoPerfil = rows[0].foto_perfil || null;
          }
        }
      } catch {
        // Se não encontrar perfil, usa o nome da tabela usuario mesmo
      }

      // 4. Retornar sucesso com dados do usuário
      return NextResponse.json({
        success: true,
        user: {
          id: usuario.id,
          usuario_id: usuario.id,
          email: usuario.email,
          nome: nomeDisplay,
          sobrenome: sobrenomeDisplay,
          tipo,
          foto_perfil: fotoPerfil,
        }
      });
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}