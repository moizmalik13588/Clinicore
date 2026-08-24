import { CallWithRelations, CallWithMoodRelations } from './calls.mapper';
import {
    CreateCallRepoDto,
    UpdateCallRepoDto,
    ListCallsDto,
    CreateCallDto,
    UpdateCallDto,
} from './calls.dto';
import {
    CallResponse,
    CallWithTranscriptResponse,
    CallWithMoodTimelineResponse,
    CallListResponse,
} from './calls.response';

export interface ICallsRepository {
    findAll(clinicId: string, dto: ListCallsDto, offset: number, limit: number): Promise<{ data: CallWithRelations[]; total: number }>;
    findById(id: string, clinicId: string): Promise<CallWithRelations | null>;
    findByIdWithMood(id: string, clinicId: string): Promise<CallWithMoodRelations | null>;
    findByRetellCallId(retellCallId: string): Promise<CallWithRelations | null>;
    findByRetellIdWithMood(retellCallId: string): Promise<CallWithMoodRelations | null>;
    findTodayCount(clinicId: string): Promise<number>;
    create(dto: CreateCallRepoDto): Promise<CallWithRelations>;
    update(id: string, clinicId: string, dto: UpdateCallRepoDto): Promise<CallWithRelations>;
    updateMoodSummary(id: string, dominantMood: string, avgIntensity: number): Promise<void>;
}

export interface ICallsService {
    list(clinicId: string, query: ListCallsDto): Promise<CallListResponse>;
    getById(id: string, clinicId: string): Promise<CallWithTranscriptResponse>;
    getWithMoodTimeline(id: string, clinicId: string): Promise<CallWithMoodTimelineResponse>;
    computeMoodSummary(id: string, clinicId: string): Promise<CallWithMoodTimelineResponse>;
    create(clinicId: string, dto: CreateCallDto): Promise<CallResponse>;
    update(id: string, clinicId: string, dto: UpdateCallDto): Promise<CallResponse>;
}