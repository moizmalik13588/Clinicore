import { IRevenueRepository, IRevenueService } from './revenue.interface';
import { RevenueMapper } from './revenue.mapper';
import { NotFoundError } from '../../common/errors/app.error';
import { getPaginationParams } from '../../common/utils/helpers';
import { prisma } from '../../db/client';
import {
    CreateRevenueDto,
    ListRevenueDto,
    RevenueStatsDto,
} from './revenue.dto';
import {
    RevenueEventResponse,
    RevenueListResponse,
    RevenueStatsResponse,
} from './revenue.response';

export class RevenueService implements IRevenueService {

    constructor(private readonly repo: IRevenueRepository) { }

    async create(clinicId: string, dto: CreateRevenueDto): Promise<RevenueEventResponse> {
        // Returning patient check
        let type = dto.type;

        if (dto.patientId && type === 'consultation') {
            const patient = await prisma.patient.findFirst({
                where: { id: dto.patientId, clinicId },
                select: { totalVisits: true },
            });

            if (patient) {
                type = patient.totalVisits > 1 ? 'returning_patient' : 'new_patient';
            }
        }

        const event = await this.repo.create({
            clinicId,
            patientId: dto.patientId,
            appointmentId: dto.appointmentId,
            amount: dto.amount,
            type,
            description: dto.description,
        });

        return RevenueMapper.toResponse(event);
    }

    async list(clinicId: string, query: ListRevenueDto): Promise<RevenueListResponse> {
        const { page, limit, offset } = getPaginationParams({
            page: query.page as any, limit: query.limit as any,
        });

        const { data, total, totalAmount } = await this.repo.findAll(
            clinicId, query, offset, limit,
        );

        return {
            data: RevenueMapper.toResponseList(data),
            total, page, limit,
            totalPages: Math.ceil(total / limit),
            totalAmount,
        };
    }

    async getStats(clinicId: string, query: RevenueStatsDto): Promise<RevenueStatsResponse> {
        return this.repo.getStats(clinicId, query);
    }

    async delete(id: string, clinicId: string): Promise<void> {
        const existing = await this.repo.findById(id, clinicId);
        if (!existing) throw new NotFoundError('Revenue event');
        await this.repo.delete(id, clinicId);
    }
}