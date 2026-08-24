import { IPatientsRepository, IPatientsService } from './patients.interface';
import { PatientsMapper } from './patients.mapper';
import { NotFoundError, ConflictError } from '../../common/errors/app.error';
import { getPaginationParams, normalizePhone } from '../../common/utils/helpers';
import {
    CreatePatientDto,
    UpdatePatientDto,
    ListPatientsDto,
} from './patients.dto';
import { PatientResponse, PatientListResponse } from './patients.response';

export class PatientsService implements IPatientsService {

    constructor(private readonly repo: IPatientsRepository) { }

    async list(clinicId: string, query: ListPatientsDto): Promise<PatientListResponse> {
        const { page, limit, offset } = getPaginationParams({
            page: query.page as any, limit: query.limit as any,
        });
        const { data, total } = await this.repo.findAll(clinicId, query, offset, limit);
        return {
            data: PatientsMapper.toResponseList(data),
            total, page, limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getById(id: string, clinicId: string): Promise<PatientResponse> {
        const patient = await this.repo.findById(id, clinicId);
        if (!patient) throw new NotFoundError('Patient');
        return PatientsMapper.toResponse(patient);
    }

    async create(clinicId: string, dto: CreatePatientDto): Promise<PatientResponse> {
        // Duplicate phone check
        const existing = await this.repo.findByPhone(dto.phone, clinicId);
        if (existing) throw new ConflictError(`Patient with phone ${dto.phone} already exists`);

        const patient = await this.repo.create({
            clinicId,
            name: dto.name,
            phone: dto.phone,
            email: dto.email || undefined,
            gender: dto.gender,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            notes: dto.notes,
            preferredDoctorId: dto.preferredDoctorId,
            preferredTimeSlot: dto.preferredTimeSlot,
            crmTags: dto.crmTags || [],
        });

        return PatientsMapper.toResponse(patient);
    }

    async update(id: string, clinicId: string, dto: UpdatePatientDto): Promise<PatientResponse> {
        const existing = await this.repo.findById(id, clinicId);
        if (!existing) throw new NotFoundError('Patient');

        // Phone uniqueness check
        if (dto.phone) {
            const phoneExists = await this.repo.findByPhone(dto.phone, clinicId);
            if (phoneExists && phoneExists.id !== id) {
                throw new ConflictError(`Phone ${dto.phone} already in use`);
            }
        }

        const patient = await this.repo.update(id, clinicId, {
            name: dto.name,
            phone: dto.phone,
            email: dto.email === '' ? null : dto.email,
            gender: dto.gender,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            notes: dto.notes,
            preferredDoctorId: dto.preferredDoctorId ?? null,
            preferredTimeSlot: dto.preferredTimeSlot,
            crmTags: dto.crmTags,
        });

        return PatientsMapper.toResponse(patient);
    }

    async delete(id: string, clinicId: string): Promise<void> {
        const existing = await this.repo.findById(id, clinicId);
        if (!existing) throw new NotFoundError('Patient');
        await this.repo.softDelete(id, clinicId);
    }
}