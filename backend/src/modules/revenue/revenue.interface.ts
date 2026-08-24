import { RevenueWithRelations } from './revenue.mapper';
import {
    CreateRevenueRepoDto,
    ListRevenueDto,
    CreateRevenueDto,
    RevenueStatsDto,
} from './revenue.dto';
import {
    RevenueStatsResponse,
    RevenueListResponse,
    RevenueEventResponse,
} from './revenue.response';

export interface IRevenueRepository {
    create(dto: CreateRevenueRepoDto): Promise<RevenueWithRelations>;
    findAll(clinicId: string, dto: ListRevenueDto, offset: number, limit: number): Promise<{ data: RevenueWithRelations[]; total: number; totalAmount: number }>;
    findById(id: string, clinicId: string): Promise<RevenueWithRelations | null>;
    getStats(clinicId: string, dto: RevenueStatsDto): Promise<RevenueStatsResponse>;
    delete(id: string, clinicId: string): Promise<void>;
}

export interface IRevenueService {
    create(clinicId: string, dto: CreateRevenueDto): Promise<RevenueEventResponse>;
    list(clinicId: string, query: ListRevenueDto): Promise<RevenueListResponse>;
    getStats(clinicId: string, query: RevenueStatsDto): Promise<RevenueStatsResponse>;
    delete(id: string, clinicId: string): Promise<void>;
}