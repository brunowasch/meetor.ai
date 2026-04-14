import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token) {
        return NextResponse.json({ authorized: false, reason: "Token da reunião ausente." }, { status: 400 });
    }

    if (!email) {
        return NextResponse.json({ authorized: false, reason: "Usuário não autenticado." }, { status: 401 });
    }

    try {
        const reuniao = await prisma.mentorconnect_reuniao.findUnique({
            where: { token },
        });

        if (!reuniao) {
            return NextResponse.json({ authorized: false, reason: "Reunião não encontrada." }, { status: 404 });
        }

        if (reuniao.status === "cancelada") {
            return NextResponse.json({ authorized: false, reason: "Esta reunião foi cancelada." }, { status: 403 });
        }

        const usuario = await prisma.mentorconnect_usuario.findFirst({
            where: { email },
        });

        if (!usuario) {
            return NextResponse.json({ authorized: false, reason: "Conta não encontrada no Mentorship Connections. Faça login." }, { status: 403 });
        }

        const connectSkillsUrl = process.env.CONNECT_SKILLS_URL?.replace(/\/$/, "");
        const syncSecret = process.env.SYNC_SECRET;

        if (!connectSkillsUrl || !syncSecret) {
            console.error("CONNECT_SKILLS_URL ou SYNC_SECRET não configurado.");
            return NextResponse.json({ authorized: false, reason: "Configuração de segurança incompleta." }, { status: 500 });
        }

        let authorizedUsuarioIds: string[] = [];
        let mentorUsuarioId: string | null = null;
        let entrevistaId: string | null = null;

        try {
            const csRes = await fetch(
                `${connectSkillsUrl}/api/mentor/interview/participants?token=${encodeURIComponent(token)}`,
                {
                    headers: { "x-sync-secret": syncSecret },
                    signal: AbortSignal.timeout(8000),
                }
            );

            if (csRes.ok) {
                const csData = await csRes.json();
                authorizedUsuarioIds = csData.authorizedUsuarioIds ?? [];
                mentorUsuarioId = csData.mentorUsuarioId ?? null;
                entrevistaId = csData.entrevistaId ?? null;
            } else if (csRes.status === 404) {
                authorizedUsuarioIds = [reuniao.criado_por];
            } else {
                console.error("CS Retornou status:", csRes.status, await csRes.text());
                return NextResponse.json({ authorized: false, reason: "Não foi possível verificar autorização. Tente novamente." }, { status: 503 });
            }
        } catch (fetchErr) {
            console.error("Erro ao contactar CS:", fetchErr);
            return NextResponse.json({ authorized: false, reason: "Serviço de autenticação temporariamente indisponível." }, { status: 503 });
        }

        const isAuthorized = authorizedUsuarioIds.includes(usuario.usuario_id);

        if (!isAuthorized) {
            return NextResponse.json({
                authorized: false,
                reason: "Você não tem permissão para participar desta reunião. Apenas os participantes designados podem entrar.",
            }, { status: 403 });
        }

        const isMentor = mentorUsuarioId !== null && usuario.usuario_id === mentorUsuarioId;

        return NextResponse.json({
            authorized: true,
            isMentor,
            entrevistaId,
            user: {
                email: usuario.email,
                nome: usuario.nome,
                sobrenome: usuario.sobrenome,
                tipo: usuario.tipo,
                foto_perfil: usuario.foto_perfil,
                usuario_id: usuario.usuario_id,
            },
            reuniao: {
                id: reuniao.id,
                titulo: reuniao.titulo,
                status: reuniao.status,
                criado_por: reuniao.criado_por,
            },
        });
    } catch (error) {
        console.error("Erro:", error);
        return NextResponse.json({ authorized: false, reason: "Erro interno do servidor." }, { status: 500 });
    }
}
