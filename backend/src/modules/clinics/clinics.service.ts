import { prisma } from '../../db/client';
import { env } from '../../config/env';
import {
    createRetellAgent,
    getRetellAgent,
    updateRetellAgent,
    listRetellAgents,
} from '../../common/utils/retell.helper';
import { AppError } from '../../common/errors/app.error';

export class ClinicsService {

    // ─── Create Retell Agent for clinic ──────────────────────────────────────
    async createAgent(
        clinicId: string,
        opts: {
            voiceId: string;
            agentName: string;
            beginMessage?: string;
        },
    ) {
        const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
        if (!clinic) throw new AppError('Clinic not found', 404);

        // Retell mein agent banao — Custom LLM mode
        const agent = await createRetellAgent({
            agent_name: opts.agentName,
            voice_id: opts.voiceId,
            response_engine: {
                type: 'custom-llm',
                llm_websocket_url: env.RETELL_LLM_WEBSOCKET_URL,
            },
            language: 'en-US',
            enable_backchannel: true,
            interruption_sensitivity: 0.8,
            end_call_after_silence_ms: 30000,
            max_call_duration_ms: 600000, // 10 min max
            begin_message: opts.beginMessage ||
                `Thank you for calling ${clinic.name}. How can I help you today?`,
        });

        // Agent ID clinic mein save karo
        await prisma.clinic.update({
            where: { id: clinicId },
            data: { retellAgentId: agent.agent_id },
        });

        console.log(`[Retell] Agent created: ${agent.agent_id} for clinic: ${clinicId}`);

        return {
            agentId: agent.agent_id,
            agentName: agent.agent_name,
            voiceId: agent.voice_id,
            message: 'Agent created successfully. Add RETELL_AGENT_ID to your .env file.',
        };
    }

    // ─── Get Agent Info ───────────────────────────────────────────────────────
    async getAgent(clinicId: string) {
        const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
        if (!clinic) throw new AppError('Clinic not found', 404);
        if (!clinic.retellAgentId) throw new AppError('No agent created yet', 404);

        const agent = await getRetellAgent(clinic.retellAgentId);

        return {
            agentId: agent.agent_id,
            agentName: agent.agent_name,
            voiceId: agent.voice_id,
            createdAt: agent.created_at,
        };
    }

    // ─── System Health Check ──────────────────────────────────────────────────
    async healthCheck(clinicId: string) {
        const checks: Record<string, boolean | string> = {};

        // DB check
        try {
            await prisma.clinic.findUnique({ where: { id: clinicId } });
            checks.database = true;
        } catch {
            checks.database = false;
        }

        // Retell check
        try {
            await listRetellAgents();
            checks.retell = true;
        } catch (err: any) {
            checks.retell = err.message;
        }

        // Env vars check
        checks.retellApiKey = !!env.RETELL_API_KEY;
        checks.retellAgentId = !!env.RETELL_AGENT_ID;
        checks.webhookSecret = !!env.RETELL_WEBHOOK_SECRET;
        checks.openRouterKey = !!env.OPENROUTER_API_KEY;
        checks.twilioConfigured = !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);

        const allHealthy = Object.values(checks).every(v => v === true);

        return { healthy: allHealthy, checks };
    }

    // ─── Get Clinic Info ──────────────────────────────────────────────────────
    async getClinic(clinicId: string) {
        const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
        if (!clinic) throw new AppError('Clinic not found', 404);
        return clinic;
    }

    // ─── Update Clinic ────────────────────────────────────────────────────────
    async updateClinic(clinicId: string, data: {
        name?: string;
        phone?: string;
        address?: string;
        apptDurationMins?: number;
    }) {
        return prisma.clinic.update({
            where: { id: clinicId },
            data,
        });
    }
}

export const clinicsService = new ClinicsService();