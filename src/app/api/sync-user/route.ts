import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYNC_SECRET = process.env.SYNC_SECRET;

export async function POST(req: NextRequest) {
  // 1. Validar chave de segurança
  const authHeader = req.headers.get("x-sync-secret");
  if (!SYNC_SECRET || authHeader !== SYNC_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Ler body enviado pelo Connect Skills
  const body = await req.json();
  const { 
    usuario_id, 
    tipo, 
    email, 
    senha,
    nome, 
    sobrenome, 
    foto_perfil, 
    cidade, 
    estado, 
    pais, 
    bio_descricao 
  } = body as any;

  if (!usuario_id || !tipo || !email) {
    return NextResponse.json(
      { error: "usuario_id, tipo e email são obrigatórios no webhook." },
      { status: 400 }
    );
  }

  // Apenas candidato e mentor são sincronizados
  if (tipo !== "candidato" && tipo !== "mentor") {
    return NextResponse.json(
      { message: `Tipo "${tipo}" não sincronizável. Ignorado.` },
      { status: 200 }
    );
  }

  try {
    const existingUser = await prisma.mentorconnect_usuario.findFirst({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.usuario_id !== usuario_id) {
         await prisma.mentorconnect_usuario.deleteMany({
            where: { 
                usuario_id: usuario_id,
                id: { not: existingUser.id }
            }
         });
      }

      await prisma.mentorconnect_usuario.update({
        where: { id: existingUser.id },
        data: {
          usuario_id,
          senha: senha || existingUser.senha, 
          nome: nome || existingUser.nome,
          sobrenome: sobrenome || existingUser.sobrenome,
          tipo,
          foto_perfil: foto_perfil || existingUser.foto_perfil,
          cidade: cidade || existingUser.cidade,
          estado: estado || existingUser.estado,
          pais: pais || existingUser.pais,
          bio_descricao: bio_descricao || existingUser.bio_descricao,
          atualizado_em: new Date(),
        }
      });

    } else {
      await prisma.mentorconnect_usuario.create({
        data: {
          usuario_id,
          email,
          senha: senha || null,
          nome: nome || null,
          sobrenome: sobrenome || null,
          tipo,
          foto_perfil: foto_perfil || null,
          cidade: cidade || null,
          estado: estado || null,
          pais: pais || null,
          bio_descricao: bio_descricao || null,
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `${tipo} sincronizado com sucesso no MentorConnect.`,
      usuario_id,
    });
  } catch (err) {
    console.error("Erro no sync-user:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
