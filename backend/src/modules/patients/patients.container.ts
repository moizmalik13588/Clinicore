import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { IPatientsRepository } from './patients.interface';

const patientsRepository: IPatientsRepository = new PatientsRepository();
const patientsService = new PatientsService(patientsRepository);
const patientsController = new PatientsController(patientsService);

export { patientsController };