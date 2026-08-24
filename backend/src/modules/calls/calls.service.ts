import { ICallsRepository, ICallsService } from './calls.interface';
import { CallsMapper } from './calls.mapper';
import { NotFoundError } from '../../common/errors/app.error';
import { getPaginationParams } from '../../common/utils/helpers';
import { CallDirection } from '../../common/types';
import {
    CreateCallDto,
    UpdateCallDto,
    ListCallsDto,
} from './calls.dto';
import {
    CallResponse,
    CallWithTranscriptResponse,
    CallWithMoodTimelineResponse,
    CallListResponse,
} from './calls.response';

export class CallsService implements ICallsService {

    constructor(private readonly repo: ICallsRepository) { }

    async list(clinicId: string, query: ListCallsDto): Promise<CallListResponse> {
        const { page, limit, offset } = getPaginationParams({
            page: query.page as any, limit: query.limit as any,
        });
        const { data, total } = await this.repo.findAll(clinicId, query, offset, limit);
        return {
            data: CallsMapper.toResponseList(data),
            total, page, limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getById(id: string, clinicId: string): Promise<CallWithTranscriptResponse> {
        const call = await this.repo.findById(id, clinicId);
        if (!call) throw new NotFoundError('Call');
        return CallsMapper.toDetailResponse(call);
    }

    // ─── Get call with full mood timeline ────────────────────────────────────
    async getWithMoodTimeline(
        id: string,
        clinicId: string,
    ): Promise<CallWithMoodTimelineResponse> {
        const call = await this.repo.findByIdWithMood(id, clinicId);
        if (!call) throw new NotFoundError('Call');
        return CallsMapper.toMoodTimelineResponse(call);
    }

    // ─── Compute + save mood summary ─────────────────────────────────────────
    async computeMoodSummary(
        id: string,
        clinicId: string,
    ): Promise<CallWithMoodTimelineResponse> {
        const call = await this.repo.findByIdWithMood(id, clinicId);
        if (!call) throw new NotFoundError('Call');

        const response = CallsMapper.toMoodTimelineResponse(call);

        // DB mein save karo
        if (response.moodSummary.totalEvents > 0) {
            await this.repo.updateMoodSummary(
                call.id,
                response.moodSummary.dominantMood,
                response.moodSummary.avgIntensity,
            );

            // Patient last mood update karo
            if (call.patientId) {
                const { prisma } = await import('../../db/client');
                await prisma.patient.update({
                    where: { id: call.patientId },
                    data: { lastMood: response.moodSummary.dominantMood },
                });
            }

            console.log(`[Calls] Mood summary saved | call: ${id} | dominant: ${response.moodSummary.dominantMood}`);
        }

        return response;
    }

    async create(clinicId: string, dto: CreateCallDto): Promise<CallResponse> {
        const call = await this.repo.create({
            clinicId,
            patientId: dto.patientId,
            retellCallId: dto.retellCallId,
            fromNumber: dto.fromNumber,
            toNumber: dto.toNumber,
            direction: dto.direction ?? CallDirection.INBOUND,
            startedAt: new Date(),
        });
        return CallsMapper.toResponse(call);
    }

    async update(id: string, clinicId: string, dto: UpdateCallDto): Promise<CallResponse> {
        const existing = await this.repo.findById(id, clinicId);
        if (!existing) throw new NotFoundError('Call');

        const call = await this.repo.update(id, clinicId, {
            patientId: dto.patientId,
            status: dto.status,
            duration: dto.duration,
            transcript: dto.transcript,
            dominantMood: dto.dominantMood,
            avgIntensity: dto.avgIntensity,
            endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
        });
        return CallsMapper.toResponse(call);
    }
}