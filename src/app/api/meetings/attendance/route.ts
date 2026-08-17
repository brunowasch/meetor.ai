import { NextRequest, NextResponse } from "next/server";
import { authorizeMeetingParticipant } from "@/lib/meeting-authz";

const VALID_ACTIONS = ["join", "leave", "mark_absent_by_mentor", "mark_absent_auto"] as const;
type Action = (typeof VALID_ACTIONS)[number];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, email, action } = body as {
            token?: string;
            email?: string;
            action?: string;
        };

        if (!action || !VALID_ACTIONS.includes(action as Action)) {
            return NextResponse.json({ error: "action inválida." }, { status: 400 });
        }

        const authz = await authorizeMeetingParticipant(token, email);
        if (!authz.authorized) {
            return NextResponse.json({ error: authz.reason }, { status: authz.status });
        }

        const mentorOnly = action === "mark_absent_by_mentor" || action === "mark_absent_auto";
        if (mentorOnly && !authz.isMentor) {
            return NextResponse.json({ error: "Apenas o mentor pode marcar falta." }, { status: 403 });
        }
        if (!mentorOnly && authz.isMentor) {
            return NextResponse.json({ error: "Ação válida apenas para o candidato." }, { status: 403 });
        }

        const entrevistaId = authz.entrevistaId;
        if (!entrevistaId) {
            return NextResponse.json({ error: "Reunião sem entrevista vinculada." }, { status: 400 });
        }

        const connectSkillsUrl = process.env.CONNECT_SKILLS_URL?.replace(/\/$/, "");
        const syncSecret = process.env.SYNC_SECRET;

        if (!connectSkillsUrl || !syncSecret) {
            console.error("CONNECT_SKILLS_URL ou SYNC_SECRET não configurado.");
            return NextResponse.json({ error: "Configuração de serviço incompleta." }, { status: 500 });
        }

        const csRes = await fetch(`${connectSkillsUrl}/api/mentor/interview/attendance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-sync-secret": syncSecret,
            },
            body: JSON.stringify({
                entrevistaId,
                action,
            }),
            signal: AbortSignal.timeout(10000),
        });

        const data = await csRes.json();

        if (!csRes.ok) {
            return NextResponse.json({ error: data.error ?? "Erro ao salvar comparecimento." }, { status: csRes.status });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[POST /api/meetings/attendance] Erro:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
