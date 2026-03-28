import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.redirect(new URL("/login?error=missing_user", req.url));
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [usuarios] = await conn.execute<any[]>(
        "SELECT id, email, tipo, nome, sobrenome FROM usuario WHERE id = ?",
        [userId]
      );

      if (usuarios.length === 0) {
        return NextResponse.redirect(new URL("/login?error=user_not_found", req.url));
      }

      const usuario = usuarios[0];
      const tipo = (usuario.tipo || "").toLowerCase();
      let nomeDisplay = usuario.nome;
      let sobrenomeDisplay = usuario.sobrenome;
      let fotoPerfil: string | null = null;

      try {
        if (tipo === "candidato") {
          const [rows] = await conn.execute<any[]>(
            "SELECT nome, sobrenome, foto_perfil FROM candidato WHERE usuario_id = ?",
            [userId]
          );
          if (rows.length) {
            nomeDisplay = rows[0].nome || nomeDisplay;
            sobrenomeDisplay = rows[0].sobrenome || sobrenomeDisplay;
            fotoPerfil = rows[0].foto_perfil || null;
          }
        } else if (tipo === "mentor") {
          const [rows] = await conn.execute<any[]>(
            "SELECT nome, sobrenome, foto_perfil FROM mentor WHERE usuario_id = ?",
            [userId]
          );
          if (rows.length) {
            nomeDisplay = rows[0].nome || nomeDisplay;
            sobrenomeDisplay = rows[0].sobrenome || sobrenomeDisplay;
            fotoPerfil = rows[0].foto_perfil || null;
          }
        }
      } catch (err) {
        console.error("Erro ao buscar dados do perfil candidato/mentor:", err);
      }

      const userData = {
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
        nome: nomeDisplay,
        sobrenome: sobrenomeDisplay,
        foto_perfil: fotoPerfil,
      };

      // Retornar um HTML que injeta o localStorage e redireciona.
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Autenticando...</title>
        </head>
        <body>
          <script>
            localStorage.setItem("mc_user", JSON.stringify(${JSON.stringify(userData)}));
            window.location.href = "/";
          </script>
        </body>
        </html>
      `;

      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Erro no social-callback:", err);
    return NextResponse.redirect(new URL("/login?error=internal", req.url));
  }
}
