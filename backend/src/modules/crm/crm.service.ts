import { ICrmRepository, ICrmService } from './crm.interface';
import { CrmMapper } from './crm.mapper';
import { PatientsMapper } from '../patients/patients.mapper';
import { NotFoundError } from '../../common/errors/app.error';
import { getPaginationParams } from '../../common/utils/helpers';
import { CreateVisitDto, CrmSearchDto, PhoneLookupDto } from './crm.dto';
import {
    CrmPatientContext,
    VisitHistoryResponse,
    MoodLogListResponse,
    VisitResponse,
} from './crm.response';

export class CrmService implements ICrmService {

    constructor(private readonly repo: ICrmRepository) { }

    // ─── Phone Lookup — CRM ka core ────────────────────────────────────────────
    async lookupByPhone(phone: string, clinicId: string): Promise<CrmPatientContext | null> {
        const patient = await this.repo.findPatientByPhone(phone, clinicId);
        if (!patient) return null;

        const [lastVisit, totalCalls] = await Promise.all([
            this.repo.findLastVisit(patient.id, clinicId),
            this.repo.findCallsCount(patient.id, clinicId),
        ]);

        return {
            patient: PatientsMapper.toResponse(patient),
            isReturning: patient.totalVisits > 0,
            lastVisit: lastVisit ? CrmMapper.toVisitResponse(lastVisit) : null,
            totalCalls,
        };
    }

    // ─── Visit History ─────────────────────────────────────────────────────────
    async getPatientHistory(patientId: string, clinicId: string): Promise<VisitHistoryResponse> {
        const patient = await this.repo.findPatientById(patientId, clinicId);
        if (!patient) throw new NotFoundError('Patient');

        const { data, total } = await this.repo.findVisitHistory(patientId, clinicId);

        return {
            data: data.map(CrmMapper.toVisitResponse),
            total,
        };
    }

    // ─── Mood Log ──────────────────────────────────────────────────────────────
    async getPatientMoodLog(patientId: string, clinicId: string): Promise<MoodLogListResponse> {
        const patient = await this.repo.findPatientById(patientId, clinicId);
        if (!patient) throw new NotFoundError('Patient');

        const { data, total } = await this.repo.findMoodLog(patientId, clinicId);

        return {
            data: data.map(CrmMapper.toMoodLogResponse),
            total,
        };
    }

    // ─── Create Visit ──────────────────────────────────────────────────────────
    async createVisit(clinicId: string, dto: CreateVisitDto): Promise<VisitResponse> {
        const patient = await this.repo.findPatientById(dto.patientId, clinicId);
        if (!patient) throw new NotFoundError('Patient');

        const visit = await this.repo.createVisit({
            clinicId,
            patientId: dto.patientId,
            appointmentId: dto.appointmentId,
            doctorId: dto.doctorId,
            visitDate: new Date(dto.visitDate),
            chiefComplaint: dto.chiefComplaint,
            diagnosis: dto.diagnosis,
            treatmentNotes: dto.treatmentNotes,
            followUpDays: dto.followUpDays,
        });

        return CrmMapper.toVisitResponse(visit);
    }

    // ─── Advanced Search ───────────────────────────────────────────────────────
    async search(clinicId: string, query: CrmSearchDto) {
        const { page, limit, offset } = getPaginationParams({
            page: query.page as any, limit: query.limit as any,
        });

        const { data, total } = await this.repo.searchPatients(
            clinicId, query.q, offset, limit,
        );

        return {
            data: data.map(PatientsMapper.toResponse),
            total, page, limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}