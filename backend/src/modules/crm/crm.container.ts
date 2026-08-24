import { CrmRepository } from './crm.repository';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { ICrmRepository } from './crm.interface';

const crmRepository: ICrmRepository = new CrmRepository();
const crmService = new CrmService(crmRepository);
const crmController = new CrmController(crmService);

export { crmController };