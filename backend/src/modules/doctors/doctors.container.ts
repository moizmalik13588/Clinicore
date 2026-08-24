import { DoctorsRepository } from './doctors.repository';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { IDoctorsRepository } from './doctors.interface';

const doctorsRepository: IDoctorsRepository = new DoctorsRepository();
const doctorsService = new DoctorsService(doctorsRepository);
const doctorsController = new DoctorsController(doctorsService);

export { doctorsController };