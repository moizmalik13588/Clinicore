import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { IAppointmentsRepository } from './appointments.interface';

const appointmentsRepository: IAppointmentsRepository = new AppointmentsRepository();
const appointmentsService = new AppointmentsService(appointmentsRepository);
const appointmentsController = new AppointmentsController(appointmentsService);

export { appointmentsController };