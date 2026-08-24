import { IAppointmentsRepository, IAppointmentsService } from './appointments.interface';
import { AppointmentsMapper } from './appointments.mapper';
import { NotFoundError } from '../../common/errors/app.error';
import { getPaginationParams } from '../../common/utils/helpers';
import { calendarService } from '../calendar/calendar.service';
import { smsService } from '../sms/sms.service';
// appointments.service.ts mein update karo — create method ke setImmediate mein add karo

import { revenueController } from '../revenue/revenue.container';
import { prisma } from '../../db/client';
import {
    CreateAppointmentDto,
    UpdateAppointmentDto,
    ListAppointmentsDto,
} from './appointments.dto';
import {
    AppointmentResponse,
    AppointmentListResponse,
} from './appointments.response';

export class AppointmentsService implements IAppointmentsService {

    constructor(private readonly repo: IAppointmentsRepository) { }

    async list(clinicId: string, query: ListAppointmentsDto): Promise<AppointmentListResponse> {
        const { page, limit, offset } = getPaginationParams({
            page: query.page as any,
            limit: query.limit as any,
        });
        const { data, total } = await this.repo.findAll(clinicId, query, offset, limit);
        return {
            data: AppointmentsMapper.toResponseList(data),
            total, page, limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getById(id: string, clinicId: string): Promise<AppointmentResponse> {
        const appt = await this.repo.findById(id, clinicId);
        if (!appt) throw new NotFoundError('Appointment');
        return AppointmentsMapper.toResponse(appt);
    }

    // ─── Create — SMS + Calendar bhi trigger karo ─────────────────────────────
    async create(clinicId: string, dto: CreateAppointmentDto): Promise<AppointmentResponse> {
        const apptDate = new Date(dto.appointmentDate);
        const endDate = new Date(apptDate.getTime() + (dto.duration || 30) * 60000);

        const appt = await this.repo.create({
            clinicId,
            patientId: dto.patientId,
            doctorId: dto.doctorId,
            appointmentDate: apptDate,
            duration: dto.duration || 30,
            type: dto.type,
            notes: dto.notes,
        });

        const response = AppointmentsMapper.toResponse(appt);

        // ─── Async: SMS + Calendar (appointment block nahi karo) ────────────────
        setImmediate(async () => {
            try {
                // SMS confirmation
                await smsService.sendAppointmentConfirmation(appt.id);
                console.log(`[Appointment] Confirmation SMS sent | ${appt.id}`);
            } catch (err) {
                console.error('[Appointment] SMS failed:', err);
            }

            try {
                // Google Calendar event
                const isCalendarConnected = await calendarService.isConnected(clinicId);

                if (isCalendarConnected) {
                    const description = [
                        `Patient: ${appt.patient.name}`,
                        `Phone: ${appt.patient.phone}`,
                        `Type: ${appt.type}`,
                        appt.doctor ? `Doctor: ${appt.doctor.name}` : '',
                        dto.notes ? `Notes: ${dto.notes}` : '',
                    ].filter(Boolean).join('\n');

                    const event = await calendarService.createEvent(clinicId, {
                        title: `Appointment — ${appt.patient.name}`,
                        description,
                        startTime: apptDate,
                        endTime: endDate,
                        attendeeEmail: appt.patient.email || undefined,
                    });

                    if (event?.eventId) {
                        // Calendar event ID save karo
                        await this.repo.update(appt.id, clinicId, {
                            calendarEventId: event.eventId,
                        } as any);
                        console.log(`[Appointment] Calendar event created | ${event.eventId}`);
                    }
                }
            } catch (err) {
                console.error('[Appointment] Calendar failed:', err);
            }
            try {
                // Patient visiting check — new ya returning
                const patient = await prisma.patient.findUnique({
                    where: { id: appt.patientId },
                    select: { totalVisits: true },
                });

                const revenueType = patient && patient.totalVisits > 1
                    ? 'returning_patient'
                    : 'new_patient';

                await prisma.revenueEvent.create({
                    data: {
                        clinicId: clinicId,
                        patientId: appt.patientId,
                        appointmentId: appt.id,
                        amount: 500,  // Default amount — clinic settings se aayega baad mein
                        type: revenueType,
                        description: `${revenueType === 'new_patient' ? 'New' : 'Returning'} patient appointment`,
                    },
                });

                console.log(`[Revenue] Event recorded | type: ${revenueType}`);
            } catch (err) {
                console.error('[Revenue] Failed to record:', err);
            }
        });

        return response;
    }

    // ─── Update — status change pe bhi SMS bhejo ──────────────────────────────
    async update(id: string, clinicId: string, dto: UpdateAppointmentDto): Promise<AppointmentResponse> {
        const existing = await this.repo.findById(id, clinicId);
        if (!existing) throw new NotFoundError('Appointment');

        const appt = await this.repo.update(id, clinicId, {
            doctorId: dto.doctorId,
            appointmentDate: dto.appointmentDate ? new Date(dto.appointmentDate) : undefined,
            duration: dto.duration,
            status: dto.status,
            type: dto.type,
            notes: dto.notes,
        });

        const response = AppointmentsMapper.toResponse(appt);

        // Status change pe async actions
        if (dto.status) {
            setImmediate(async () => {
                try {
                    // Confirmed → confirmation SMS
                    if (dto.status === 'confirmed') {
                        await smsService.sendAppointmentConfirmation(id);
                    }

                    // Cancelled → SMS + Calendar delete
                    if (dto.status === 'cancelled') {
                        const date = appt.appointmentDate.toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric',
                        });
                        const time = appt.appointmentDate.toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit',
                        });

                        await smsService.sendCustom(
                            appt.patient.phone,
                            `Hi ${appt.patient.name}, your appointment on ${date} at ${time} has been cancelled. To reschedule please call us.`,
                        );

                        // Calendar event delete
                        if (appt.calendarEventId) {
                            await calendarService.deleteEvent(clinicId, appt.calendarEventId);
                        }
                    }

                    // Calendar update agar date/time change hui
                    if (
                        dto.appointmentDate &&
                        appt.calendarEventId
                    ) {
                        const newDate = new Date(dto.appointmentDate);
                        const newEnd = new Date(newDate.getTime() + appt.duration * 60000);
                        await calendarService.updateEvent(clinicId, appt.calendarEventId, {
                            startTime: newDate,
                            endTime: newEnd,
                        });
                    }

                } catch (err) {
                    console.error('[Appointment] Update side-effects failed:', err);
                }
            });
        }

        return response;
    }

    async delete(id: string, clinicId: string): Promise<void> {
        const existing = await this.repo.findById(id, clinicId);
        if (!existing) throw new NotFoundError('Appointment');

        // Calendar event delete karo agar hai
        if (existing.calendarEventId) {
            setImmediate(async () => {
                try {
                    await calendarService.deleteEvent(clinicId, existing.calendarEventId!);
                } catch (err) {
                    console.error('[Appointment] Calendar delete failed:', err);
                }
            });
        }

        await this.repo.delete(id, clinicId);
    }
}