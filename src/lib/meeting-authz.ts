import { prisma } from "@/lib/prisma";


export interface MeetingAuthzResult {
    authorized: boolean;
    status: number;
    reason?: string;
    entrevistaId?: string | null;
    isMentor?: boolean;
    usuarioId?: string;
}

export async function authorizeMeetingParticipant(
    token: string | null | undefined,
    email: string | null | undefined
): Promise<MeetingAuthzResult> {
    if (!token) {
        return { authorized: false, status: 400, reason: "Token da reunião ausente." };
    }
    if (!email) {
        return { authorized: false, status: 401, reason: "Usuário não autenticado." };
    }

    const connectSkillsUrl = process.env.CONNECT_SKILLS_URL?.replace(/\/$/, "");
    const syncSecret = process.env.SYNC_SECRET;

    if (!connectSkillsUrl || !syncSecret) {
        console.error("CONNECT_SKILLS_URL ou SYNC_SECRET não configurado.");
        return { authorized: false, status: 500, reason: "Configuração de segurança incompleta." };
    }

    const reuniao = await prisma.mentorconnect_reuniao.findUnique({ where: { token } });
    if (!reuniao) {
        return { authorized: false, status: 404, reason: "Reunião não encontrada." };
    }
    if (reuniao.status === "cancelada") {
        return { authorized: false, status: 403, reason: "Esta reunião foi cancelada." };
    }

    const usuario = await prisma.mentorconnect_usuario.findFirst({ where: { email } });
    if (!usuario) {
        return { authorized: false, status: 403, reason: "Conta não encontrada." };
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
            return { authorized: false, status: 503, reason: "Não foi possível verificar autorização." };
        }
    } catch (err) {
        console.error("Erro ao contactar Connect Skills:", err);
        return { authorized: false, status: 503, reason: "Serviço de autenticação indisponível." };
    }

    if (!authorizedUsuarioIds.includes(usuario.usuario_id)) {
        return { authorized: false, status: 403, reason: "Você não participa desta reunião." };
    }

    return {
        authorized: true,
        status: 200,
        entrevistaId,
        isMentor: mentorUsuarioId !== null && usuario.usuario_id === mentorUsuarioId,
        usuarioId: usuario.usuario_id,
    };
}
