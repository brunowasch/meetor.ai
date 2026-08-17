import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyHandoffToken } from "@/lib/mentorconnect-handoff";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  const userId = verifyHandoffToken(token);

  if (!userId) {
    return NextResponse.redirect(new URL("/login?error=invalid_handoff", req.url));
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

    const serialized = JSON.stringify(userData)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

    // Retornar um HTML que injeta o localStorage e redireciona.
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autenticando...</title>
      </head>
      <body>
        <script>
          localStorage.setItem("mc_user", JSON.stringify(${serialized}));
          window.location.href = "/";
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erro no social-callback:", err);
    return NextResponse.redirect(new URL("/login?error=internal", req.url));
  }
}
