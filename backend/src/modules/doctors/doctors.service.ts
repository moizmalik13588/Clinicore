import { IDoctorsRepository, IDoctorsService } from './doctors.interface';
import { DoctorsMapper } from './doctors.mapper';
import { NotFoundError } from '../../common/errors/app.error';
import { getPaginationParams } from '../../common/utils/helpers';
import {
    CreateDoctorDto,
    UpdateDoctorDto,
    ListDoctorsDto,
} from './doctors.dto';
import { DoctorResponse, DoctorListResponse } from './doctors.response';

export class DoctorsService implements IDoctorsService {

    constructor(private readonly repo: IDoctorsRepository) { }

    async list(clinicId: string, query: ListDoctorsDto): Promise<DoctorListResponse> {
        const { page, limit, offset } = getPaginationParams({
            page: query.page as any, limit: query.limit as any,
        });
        const { data, total } = await this.repo.findAll(clinicId, query, offset, limit);
        return {
            data: DoctorsMapper.toResponseList(data),
            total, page, limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getById(id: string, clinicId: string): Promise<DoctorResponse> {
        const doc = await this.repo.findById(id, clinicId);
        if (!doc) throw new NotFoundError('Doctor');
        return DoctorsMapper.toResponse(doc);
    }

    async getActive(clinicId: string): Promise<DoctorResponse[]> {
        const docs = await this.repo.findAllActive(clinicId);
        return DoctorsMapper.toResponseList(docs);
    }

    async create(clinicId: string, dto: CreateDoctorDto): Promise<DoctorResponse> {
        const doc = await this.repo.create({ clinicId, name: dto.name, specialty: dto.specialty });
        return DoctorsMapper.toResponse(doc);
    }

    async update(id: string, clinicId: string, dto: UpdateDoctorDto): Promise<DoctorResponse> {
        const existing = await this.repo.findById(id, clinicId);
        if (!existing) throw new NotFoundError('Doctor');
        const doc = await this.repo.update(id, clinicId, dto);
        return DoctorsMapper.toResponse(doc);
    }

    async deactivate(id: string, clinicId: string): Promise<DoctorResponse> {
        const existing = await this.repo.findById(id, clinicId);
        if (!existing) throw new NotFoundError('Doctor');
        const doc = await this.repo.update(id, clinicId, { isActive: false });
        return DoctorsMapper.toResponse(doc);
    }
}