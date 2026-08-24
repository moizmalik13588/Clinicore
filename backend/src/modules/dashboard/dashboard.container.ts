import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { IDashboardRepository } from './dashboard.interface';

const dashboardRepository: IDashboardRepository = new DashboardRepository();
const dashboardService = new DashboardService(dashboardRepository);
const dashboardController = new DashboardController(dashboardService);

export { dashboardController };