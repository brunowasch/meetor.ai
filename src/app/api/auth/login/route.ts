import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const usuario = await prisma.mentorconnect_usuario.findFirst({
      where: { email },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Credenciais inválidas ou usuário não encontrado." }, { status: 401 });
    }

    // Buscar dados atualizados do perfil no Connect Skills
    let nomeCS: string | null = null;
    let sobrenomeCS: string | null = null;
    let fotoPerfilCS: string | null = null;

    const connectSkillsUrl = process.env.CONNECT_SKILLS_URL || "http://localhost:3000";
    try {
      const verifyRes = await fetch(`${connectSkillsUrl}/api/user/status?email=${encodeURIComponent(email)}`);
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (!verifyData.exists) {
          return NextResponse.json({ error: "Conta não encontrada no Connect Skills." }, { status: 401 });
        }
        // Captura nome de perfil do Connect Skills se disponível
        nomeCS       = verifyData.nome       ?? null;
        sobrenomeCS  = verifyData.sobrenome  ?? null;
        fotoPerfilCS = verifyData.foto_perfil ?? null;
      }
    } catch (e) {
      console.error("Erro ao verificar conta no Connect Skills", e);
    }

    // Verificar senha
    if (!usuario.senha) {
      return NextResponse.json({ error: "Conta sem senha configurada." }, { status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, usuario.senha);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    // Usar nome do Connect Skills; fallback para o que está salvo localmente
    const nomeRetorno      = nomeCS       ?? usuario.nome;
    const sobrenomeRetorno = sobrenomeCS  ?? usuario.sobrenome;
    const fotoRetorno      = fotoPerfilCS ?? usuario.foto_perfil;

    // Atualizar nome local se vier diferente do Connect Skills
    if (
      (nomeCS && nomeCS !== usuario.nome) ||
      (sobrenomeCS && sobrenomeCS !== usuario.sobrenome) ||
      (fotoPerfilCS && fotoPerfilCS !== usuario.foto_perfil)
    ) {
      await prisma.mentorconnect_usuario.update({
        where: { id: usuario.id },
        data: {
          nome:       nomeCS       ?? usuario.nome,
          sobrenome:  sobrenomeCS  ?? usuario.sobrenome,
          foto_perfil: fotoPerfilCS ?? usuario.foto_perfil,
          atualizado_em: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        email:       usuario.email,
        nome:        nomeRetorno,
        sobrenome:   sobrenomeRetorno,
        tipo:        usuario.tipo,
        foto_perfil: fotoRetorno,
      }
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}