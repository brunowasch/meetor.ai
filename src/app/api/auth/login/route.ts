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

    // Verificar senha
    if (!usuario.senha) {
      return NextResponse.json({ error: "Conta sem senha configurada." }, { status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, usuario.senha);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        email:       usuario.email,
        nome:        usuario.nome,
        sobrenome:   usuario.sobrenome,
        tipo:        usuario.tipo,
        foto_perfil: usuario.foto_perfil,
      }
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}