import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.redirect(new URL("/login?error=missing_user", req.url));
  }

  try {
    const usuario = await prisma.mentorconnect_usuario.findUnique({
      where: { usuario_id: userId },
    });

    if (!usuario) {
      return NextResponse.redirect(new URL("/login?error=user_not_found", req.url));
    }

    const userData = {
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      foto_perfil: usuario.foto_perfil,
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
  } catch (err) {
    console.error("Erro no social-callback:", err);
    return NextResponse.redirect(new URL("/login?error=internal", req.url));
  }
}
