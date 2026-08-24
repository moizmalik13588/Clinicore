import { prisma } from '../../db/client';
import {
    sendSms,
    appointmentConfirmationSms,
    appointmentReminderSms,
    welcomeSms,
    recallSms,
} from '../../common/utils/sms.helper';
import { AppError } from '../../common/errors/app.error';

export class SmsService {

    // ─── Appointment confirmation ─────────────────────────────────────────────
    async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
        const appt = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                patient: true,
                doctor: true,
                clinic: true,
            },
        });

        if (!appt?.patient?.phone) return;

        const date = appt.appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const time = appt.appointmentDate.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit',
        });

        const message = appointmentConfirmationSms(
            appt.patient.name,
            date,
            time,
            appt.doctor?.name || 'our doctor',
            appt.clinic.name,
        );

        await sendSms({ to: appt.patient.phone, message });
        console.log(`[SMS] Confirmation sent to ${appt.patient.phone}`);
    }

    // ─── Appointment reminder ─────────────────────────────────────────────────
    async sendAppointmentReminder(appointmentId: string): Promise<void> {
        const appt = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { patient: true, doctor: true },
        });

        if (!appt?.patient?.phone) return;

        const date = appt.appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
        });
        const time = appt.appointmentDate.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit',
        });

        const message = appointmentReminderSms(
            appt.patient.name,
            date,
            time,
            appt.doctor?.name || 'our doctor',
        );

        const result = await sendSms({ to: appt.patient.phone, message });

        if (result.success) {
            await prisma.appointment.update({
                where: { id: appointmentId },
                data: { reminderSent: true },
            });
            console.log(`[SMS] Reminder sent to ${appt.patient.phone}`);
        }
    }

    // ─── Welcome SMS ──────────────────────────────────────────────────────────
    async sendWelcome(patientId: string, clinicId: string): Promise<void> {
        const patient = await prisma.patient.findFirst({
            where: { id: patientId, clinicId },
            include: { clinic: true },
        });

        if (!patient?.phone) return;

        const message = welcomeSms(patient.name, patient.clinic.name);
        await sendSms({ to: patient.phone, message });
        console.log(`[SMS] Welcome sent to ${patient.phone}`);
    }

    // ─── Recall SMS ───────────────────────────────────────────────────────────
    async sendRecall(patientId: string, clinicId: string): Promise<void> {
        const patient = await prisma.patient.findFirst({
            where: { id: patientId, clinicId },
            include: { clinic: true },
        });

        if (!patient?.phone || !patient.lastVisitDate) return;

        const lastVisit = patient.lastVisitDate.toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
        });

        const message = recallSms(
            patient.name,
            lastVisit,
            patient.clinic.name,
            patient.lastComplaint || undefined,
        );

        await sendSms({ to: patient.phone, message });
        console.log(`[SMS] Recall sent to ${patient.phone}`);
    }

    // ─── Custom SMS ───────────────────────────────────────────────────────────
    async sendCustom(
        to: string,
        message: string,
    ): Promise<{ success: boolean; error?: string }> {
        return sendSms({ to, message });
    }

    // ─── Handle incoming SMS ──────────────────────────────────────────────────
    async handleIncomingSms(
        from: string,
        body: string,
        clinicId: string,
    ): Promise<string> {
        const upper = body.trim().toUpperCase();

        const patient = await prisma.patient.findFirst({
            where: { phone: from, clinicId },
        });

        if (!patient) {
            return 'Thank you for your message. Please call us directly for assistance.';
        }

        if (upper === 'CONFIRM') {
            const appt = await prisma.appointment.findFirst({
                where: {
                    patientId: patient.id,
                    clinicId,
                    status: 'scheduled',
                    appointmentDate: { gte: new Date() },
                },
                orderBy: { appointmentDate: 'asc' },
            });

            if (appt) {
                await prisma.appointment.update({
                    where: { id: appt.id },
                    data: { status: 'confirmed' },
                });
                return `Your appointment has been confirmed. See you soon, ${patient.name}!`;
            }
            return `We couldn't find an upcoming appointment. Please call us.`;
        }

        if (upper === 'CANCEL') {
            const appt = await prisma.appointment.findFirst({
                where: {
                    patientId: patient.id,
                    clinicId,
                    status: { in: ['scheduled', 'confirmed'] },
                    appointmentDate: { gte: new Date() },
                },
                orderBy: { appointmentDate: 'asc' },
            });

            if (appt) {
                await prisma.appointment.update({
                    where: { id: appt.id },
                    data: { status: 'cancelled' },
                });
                return `Your appointment has been cancelled, ${patient.name}. To reschedule, please call us.`;
            }
            return `We couldn't find an upcoming appointment to cancel.`;
        }

        if (upper === 'BOOK') {
            return `Hi ${patient.name}! To book an appointment, please call us or we will call you shortly.`;
        }

        return `Hi ${patient.name}! Thank you for your message. For assistance, please call us directly.`;
    }
}

export const smsService = new SmsService();