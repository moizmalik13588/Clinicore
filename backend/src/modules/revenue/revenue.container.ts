import { RevenueRepository } from './revenue.repository';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';
import { IRevenueRepository } from './revenue.interface';

const revenueRepository: IRevenueRepository = new RevenueRepository();
const revenueService = new RevenueService(revenueRepository);
const revenueController = new RevenueController(revenueService);

export { revenueController };