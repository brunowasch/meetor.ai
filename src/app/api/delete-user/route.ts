import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedSyncRequest } from "@/lib/sync-auth";

export async function POST(req: NextRequest) {
  // 1. Validar chave de segurança
  if (!isAuthorizedSyncRequest(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Ler body
  const body = await req.json();
  const { usuario_id } = body;

  if (!usuario_id) {
    return NextResponse.json(
      { error: "usuario_id é obrigatório para exclusão." },
      { status: 400 }
    );
  }

  try {
    // Excluir na tabela do MentorConnect
    await prisma.mentorconnect_usuario.delete({
      where: { usuario_id },
    });

    return NextResponse.json({
      success: true,
      message: `Usuário sincronizado (EXCLUÍDO) com sucesso no MentorConnect.`,
      usuario_id,
    });
  } catch (err: any) {
    if (err.code === "P2025") {
       return NextResponse.json({
         success: true,
         message: "Usuário já não existia no MentorConnect.",
         usuario_id,
       });
    }
    console.error("Erro no delete-user:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
