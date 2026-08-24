import { CallsRepository } from './calls.repository';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { ICallsRepository } from './calls.interface';

const callsRepository: ICallsRepository = new CallsRepository();
const callsService = new CallsService(callsRepository);
const callsController = new CallsController(callsService);

export { callsController };