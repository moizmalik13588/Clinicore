import { prisma } from '../../db/client';
import { normalizePhone } from '../../common/utils/helpers';
import { env } from '../../config/env';

export class VapiService {


    // ─── Helper: "tomorrow", "monday" etc → YYYY-MM-DD ───────────────────────
    private parseDate(text: string): string {
        if (!text) return '';

        const today = new Date();
        const lower = text.toLowerCase().trim();

        // Already YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

        // Today / Tomorrow
        if (lower === 'today') {
            return today.toISOString().split('T')[0];
        }

        if (lower === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }

        // Day names — next occurrence
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayIdx = days.indexOf(lower);
        if (dayIdx !== -1) {
            const d = new Date(today);
            const diff = (dayIdx - d.getDay() + 7) % 7 || 7;
            d.setDate(d.getDate() + diff);
            return d.toISOString().split('T')[0];
        }

        // "July 15", "15 July", "June 1st" etc
        const parsed = new Date(text);
        if (!isNaN(parsed.getTime())) {
            // Agar past mein hai to next year
            if (parsed < today) parsed.setFullYear(today.getFullYear() + 1);
            return parsed.toISOString().split('T')[0];
        }

        // "15th", "1st", "22nd" — this month ka date
        const dayMatch = text.match(/(\d{1,2})(st|nd|rd|th)?/i);
        if (dayMatch) {
            const d = new Date(today);
            d.setDate(parseInt(dayMatch[1]));
            if (d < today) d.setMonth(d.getMonth() + 1);
            return d.toISOString().split('T')[0];
        }

        return '';
    }

    // ─── Helper: "10 AM", "10:00", "ten o'clock" → HH:MM ────────────────────
    private parseTime(text: string): string {
        if (!text) return '09:00';

        const lower = text.toLowerCase().trim();

        // Already HH:MM
        if (/^\d{2}:\d{2}$/.test(text)) return text;

        // "10:00 AM", "2:30 PM"
        const timeMatch = lower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
        if (timeMatch) {
            let h = parseInt(timeMatch[1]);
            const m = parseInt(timeMatch[2] || '0');
            const ampm = timeMatch[3];
            if (ampm === 'pm' && h !== 12) h += 12;
            if (ampm === 'am' && h === 12) h = 0;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }

        // Word numbers
        const wordTimes: Record<string, string> = {
            'ten': '10:00', 'eleven': '11:00', 'twelve': '12:00',
            'one': '13:00', 'two': '14:00', 'three': '15:00',
            'four': '16:00', 'nine': '09:00', 'eight': '08:00',
            'morning': '09:00', 'afternoon': '14:00', 'evening': '17:00',
            'noon': '12:00',
        };
        for (const [word, time] of Object.entries(wordTimes)) {
            if (lower.includes(word)) return time;
        }

        return '09:00';
    }

    // ─── Helper: caller phone nikalo ─────────────────────────────────────────
    getCallerPhone(call: any): string {
        const raw =
            call?.customer?.number ||
            call?.customer?.Phone ||
            call?.phoneNumber ||
            call?.from ||
            '';
        return raw ? normalizePhone(raw) : '';
    }

    // ─── Helper: clinicId ─────────────────────────────────────────────────────
    async getClinicId(): Promise<string> {
        if (env.CLINIC_ID) return env.CLINIC_ID;
        const clinic = await prisma.clinic.findFirst({ select: { id: true } });
        return clinic?.id || '';
    }

    // ─── Helper: text numbers → digits ───────────────────────────────────────
    // "zero three two nine..." → "03290..."
    private parsePhoneText(text: string): string {
        if (!text) return '';

        // Clean karo — spaces, dashes, brackets hata do
        let cleaned = text.toString().trim();

        // Already valid number hai — sirf digits + optional +
        const digitsOnly = cleaned.replace(/[\s\-\(\)\+]/g, '');
        if (/^\d{7,15}$/.test(digitsOnly)) {
            // Pakistan number normalize karo
            if (digitsOnly.startsWith('92') && digitsOnly.length === 12) {
                return `+${digitsOnly}`;
            }
            if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
                return `+92${digitsOnly.slice(1)}`;
            }
            if (digitsOnly.startsWith('3') && digitsOnly.length === 10) {
                return `+92${digitsOnly}`;
            }
            return `+${digitsOnly}`;
        }

        // Words to digits convert karo
        const wordMap: Record<string, string> = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
            'oh': '0', 'o': '0',
            'double zero': '00', 'double one': '11', 'double two': '22',
            'double three': '33', 'double four': '44', 'double five': '55',
            'double six': '66', 'double seven': '77', 'double eight': '88',
            'double nine': '99',
        };

        let result = cleaned.toLowerCase();
        result = result.replace(/double\s+(\w+)/g, (_, w) => {
            const d = wordMap[w] || '';
            return d + d;
        });
        result = result.replace(/\b(\w+)\b/g, w => wordMap[w] ?? w);

        const digits = result.replace(/\D/g, '');

        if (digits.length >= 7) {
            if (digits.startsWith('0') && digits.length === 11) {
                return `+92${digits.slice(1)}`;
            }
            if (digits.startsWith('92') && digits.length === 12) {
                return `+${digits}`;
            }
            return `+${digits}`;
        }

        return '';
    }

    // ─── 1. Get Patient Info ──────────────────────────────────────────────────
    async getPatientInfo(args: { patientPhone: string }): Promise<string> {
        try {
            const clinicId = await this.getClinicId();

            // Phone parse karo
            const phone = this.parsePhoneText(args.patientPhone || '');

            console.log(`[Vapi] getPatientInfo | raw: "${args.patientPhone}" | parsed: "${phone}"`);

            if (!phone) {
                return `new_patient|no_phone`;
            }

            const patient = await prisma.patient.findFirst({
                where: { phone, clinicId },
                include: {
                    preferredDoctor: { select: { name: true, specialty: true } },
                },
            });

            if (!patient) {
                return `new_patient|phone:${phone}`;
            }

            const parts = [
                `returning_patient`,
                `name:${patient.name}`,
                `phone:${phone}`,
                `visits:${patient.totalVisits}`,
            ];
            if (patient.lastComplaint) parts.push(`last_complaint:${patient.lastComplaint}`);
            if (patient.lastMood) parts.push(`last_mood:${patient.lastMood}`);
            if (patient.preferredDoctor) parts.push(`preferred_doctor:Dr. ${patient.preferredDoctor.name}`);

            return parts.join('|');

        } catch (err) {
            console.error('[Vapi] getPatientInfo error:', err);
            return `new_patient`;
        }
    }

    // ─── 2. Register Patient ──────────────────────────────────────────────────
    async registerPatient(args: {
        name: string;
        phone: string;
        gender?: string;
        complaint?: string;
    }): Promise<string> {
        console.log('[Vapi] registerPatient args:', JSON.stringify(args));

        try {
            const clinicId = await this.getClinicId();

            // Phone parse karo — text ya digits dono accept karo
            const phone = this.parsePhoneText(args.phone || '');

            console.log(`[Vapi] registerPatient | raw: "${args.phone}" | parsed: "${phone}"`);

            if (!phone) {
                return `I need your phone number to register you. Could you please say your number clearly, digit by digit?`;
            }

            if (!args.name || args.name.trim().length < 2) {
                return `I need your full name to register you. Could you please tell me your name?`;
            }

            // Already exists?
            const existing = await prisma.patient.findFirst({
                where: { phone, clinicId },
            });

            if (existing) {
                return `Welcome back ${existing.name}! I found your existing record. How can I help you today?`;
            }

            const patient = await prisma.patient.create({
                data: {
                    clinicId,
                    name: args.name.trim(),
                    phone,
                    gender: args.gender || null,
                    lastComplaint: args.complaint || null,
                    crmTags: ['new-patient'],
                },
            });

            console.log(`[Vapi] ✅ Patient registered: ${patient.name} | ${phone}`);

            return `Thank you ${patient.name}! Your profile has been created. Would you like to book an appointment today?`;

        } catch (err: any) {
            console.error('[Vapi] registerPatient error:', err);
            return `I am sorry, I could not save your profile. ${err.message}`;
        }
    }

    // ─── 3. Book Appointment ──────────────────────────────────────────────────
    async bookAppointment(args: {
        patientPhone: string;
        patientName?: string;
        date: string;
        time?: string;
        doctorName?: string;
        appointmentType?: string;
        notes?: string;
    }): Promise<string> {
        console.log('[Vapi] bookAppointment args:', JSON.stringify(args));

        try {
            const clinicId = await this.getClinicId();

            // ─── Phone ────────────────────────────────────────────────────────────
            const phone = this.parsePhoneText(args.patientPhone || '');
            if (!phone) {
                return `I need your phone number to book. Could you please provide it?`;
            }

            // ─── Date ─────────────────────────────────────────────────────────────
            const dateStr = this.parseDate(args.date || '');
            if (!dateStr) {
                return `I could not understand the date. Please say something like "tomorrow", "Monday", or "July 15th".`;
            }

            // ─── Time ─────────────────────────────────────────────────────────────
            const timeStr = this.parseTime(args.time || '09:00');

            const datetime = new Date(`${dateStr}T${timeStr}:00`);
            if (isNaN(datetime.getTime())) {
                return `Invalid date or time. Please say the date and time again.`;
            }

            const dayOfWeek = datetime.getDay();

            // ─── Doctor ───────────────────────────────────────────────────────────
            let doctor = null;
            if (args.doctorName) {
                doctor = await prisma.doctor.findFirst({
                    where: {
                        clinicId, isActive: true,
                        name: { contains: args.doctorName, mode: 'insensitive' },
                    },
                });
                if (!doctor) {
                    return `I could not find a doctor named ${args.doctorName}. Could you confirm the doctor's name, or I can check any available doctor?`;
                }
            } else {
                doctor = await prisma.doctor.findFirst({
                    where: { clinicId, isActive: true },
                });
            }

            if (!doctor) {
                return `I am sorry, we don't have any doctors available right now. Please call us directly.`;
            }

            // ─── Doctor Availability Check ───────────────────────────────────────
            // Doctor id int hai availability table mein — patients/doctors uuid hain,
            // lekin DoctorAvailability schema Int use karta hai. Match numeric part
            // agar tumhare doctorId string uuid hai to yeh table alag linking use
            // kar rahi ho sakti hai — is check ko apne actual schema se align karo.

            const availability = await prisma.doctorAvailability.findFirst({
                where: {
                    dayOfWeek,
                    // Agar doctorId Int primary key se link hai:
                    // doctorId: doctor.numericId,
                },
            });

            const dayName = datetime.toLocaleDateString('en-US', { weekday: 'long' });

            if (!availability) {
                return `I'm sorry, Dr. ${doctor.name} is not available on ${dayName}s. Would you like to check another day or another doctor?`;
            }

            // ─── Time within working hours? ────────────────────────────────────────
            const [startH, startM] = availability.startTime.split(':').map(Number);
            const [endH, endM] = availability.endTime.split(':').map(Number);
            const startMins = startH * 60 + startM;
            const endMins = endH * 60 + endM;
            const requestedMins = datetime.getHours() * 60 + datetime.getMinutes();

            if (requestedMins < startMins || requestedMins + 30 > endMins) {
                const startStr = availability.startTime.slice(0, 5);
                const endStr = availability.endTime.slice(0, 5);
                return `I'm sorry, Dr. ${doctor.name} is only available on ${dayName}s between ${startStr} and ${endStr}. Could you please pick a time within that range?`;
            }

            // ─── Slot already booked? ────────────────────────────────────────────
            const existing = await prisma.appointment.findFirst({
                where: {
                    clinicId,
                    doctorId: doctor.id,
                    appointmentDate: datetime,
                    status: { notIn: ['cancelled'] },
                },
            });

            if (existing) {
                return `I'm sorry, that slot is already booked. Could you please choose a different time?`;
            }

            // ─── Patient ──────────────────────────────────────────────────────────
            let patient = await prisma.patient.findFirst({
                where: { phone, clinicId },
            });

            if (!patient) {
                if (!args.patientName) {
                    return `I could not find your record. Could you please tell me your full name?`;
                }
                patient = await prisma.patient.create({
                    data: {
                        clinicId,
                        name: args.patientName.trim(),
                        phone,
                        crmTags: ['new-patient'],
                    },
                });
                console.log(`[Vapi] ✅ Auto-registered: ${patient.name} | ${phone}`);
            }

            // ─── Create Appointment ───────────────────────────────────────────────
            const appt = await prisma.appointment.create({
                data: {
                    clinicId,
                    patientId: patient.id,
                    doctorId: doctor.id,
                    appointmentDate: datetime,
                    duration: 30,
                    status: 'scheduled',
                    type: (args.appointmentType as any) || 'general',
                    notes: args.notes || null,
                },
                include: { doctor: { select: { name: true } } },
            });

            const prettyDate = datetime.toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
            });
            const prettyTime = datetime.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit',
            });

            console.log(`[Vapi] ✅ Appointment booked | ${patient.name} | ${prettyDate} ${prettyTime}`);

            return `Your appointment is confirmed for ${prettyDate} at ${prettyTime} with Dr. ${doctor.name}. We look forward to seeing you, ${patient.name}!`;

        } catch (err: any) {
            console.error('[Vapi] bookAppointment error:', err);
            return `I am sorry, could not book the appointment. Please try again.`;
        }
    }

    // ─── 4. Cancel Appointment ────────────────────────────────────────────────
    async cancelAppointment(args: { patientPhone: string }): Promise<string> {
        try {
            const clinicId = await this.getClinicId();
            const phone = this.parsePhoneText(args.patientPhone || '');

            if (!phone) return `I need your phone number. Could you please provide it?`;

            const patient = await prisma.patient.findFirst({ where: { phone, clinicId } });
            if (!patient) return `I could not find your record. Are you sure you have an appointment with us?`;

            const appt = await prisma.appointment.findFirst({
                where: {
                    patientId: patient.id, clinicId,
                    status: { in: ['scheduled', 'confirmed'] },
                    appointmentDate: { gte: new Date() },
                },
                orderBy: { appointmentDate: 'asc' },
                include: { doctor: { select: { name: true } } },
            });

            if (!appt) return `You have no upcoming appointments to cancel. Would you like to book one?`;

            await prisma.appointment.update({
                where: { id: appt.id },
                data: { status: 'cancelled' },
            });

            const dateStr = appt.appointmentDate.toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
            });

            return `Your appointment on ${dateStr}${appt.doctor ? ` with Dr. ${appt.doctor.name}` : ''} has been cancelled. Would you like to reschedule?`;

        } catch (err: any) {
            console.error('[Vapi] cancelAppointment error:', err);
            return `I am sorry, I could not cancel. ${err.message}`;
        }
    }

    // ─── 5. Check Appointments ────────────────────────────────────────────────
    async checkAppointments(args: { patientPhone: string }): Promise<string> {
        try {
            const clinicId = await this.getClinicId();
            const phone = this.parsePhoneText(args.patientPhone || '');

            if (!phone) return `I need your phone number. Could you please provide it?`;

            const patient = await prisma.patient.findFirst({ where: { phone, clinicId } });
            if (!patient) return `I could not find any record for this number. Would you like to book an appointment?`;

            const appointments = await prisma.appointment.findMany({
                where: {
                    patientId: patient.id, clinicId,
                    status: { in: ['scheduled', 'confirmed'] },
                    appointmentDate: { gte: new Date() },
                },
                orderBy: { appointmentDate: 'asc' },
                take: 3,
                include: { doctor: { select: { name: true } } },
            });

            if (appointments.length === 0) {
                return `Hi ${patient.name}! You have no upcoming appointments. Would you like to book one?`;
            }

            const list = appointments.map(a => {
                const d = a.appointmentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                const t = a.appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return `${d} at ${t}${a.doctor ? ` with Dr. ${a.doctor.name}` : ''}`;
            }).join('. Also ');

            return `Hi ${patient.name}! Your upcoming appointment${appointments.length > 1 ? 's' : ''}: ${list}.`;

        } catch (err: any) {
            console.error('[Vapi] checkAppointments error:', err);
            return `I am sorry, I could not retrieve appointments. ${err.message}`;
        }
    }

    // ─── 6. Get Available Slots ───────────────────────────────────────────────
    async getAvailableSlots(args: { date: string; doctorName?: string }): Promise<string> {
        try {
            const clinicId = await this.getClinicId();
            if (!args.date) return `Please tell me the date you are looking for. For example, July 15th.`;

            const date = new Date(args.date);
            if (isNaN(date.getTime())) return `I could not understand that date. Could you say it more clearly?`;

            const dayOfWeek = date.getDay();

            const availability = await prisma.doctorAvailability.findFirst({
                where: { dayOfWeek },
            });

            if (!availability) {
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                return `We are not available on ${dayName}. Could you try a different day?`;
            }

            const [startH, startM] = availability.startTime.split(':').map(Number);
            const [endH, endM] = availability.endTime.split(':').map(Number);
            const startMins = startH * 60 + startM;
            const endMins = endH * 60 + endM;
            const slots: string[] = [];

            for (let m = startMins; m + availability.slotDurationMinutes <= endMins; m += availability.slotDurationMinutes) {
                const h = Math.floor(m / 60).toString().padStart(2, '0');
                const min = (m % 60).toString().padStart(2, '0');
                slots.push(`${h}:${min}`);
            }

            const dayStart = new Date(args.date); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(args.date); dayEnd.setHours(23, 59, 59, 999);

            const booked = await prisma.appointment.findMany({
                where: { clinicId, appointmentDate: { gte: dayStart, lte: dayEnd }, status: { notIn: ['cancelled'] } },
                select: { appointmentDate: true },
            });

            const bookedTimes = new Set(
                booked.map(a => `${a.appointmentDate.getHours().toString().padStart(2, '0')}:${a.appointmentDate.getMinutes().toString().padStart(2, '0')}`)
            );

            const available = slots.filter(s => !bookedTimes.has(s)).slice(0, 5);

            if (!available.length) return `All slots are booked for that day. Would you like to try another date?`;

            const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const timeList = available.map(s => {
                const [h, m] = s.split(':').map(Number);
                return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
            }).join(', ');

            return `Available slots on ${dateStr}: ${timeList}. Which time works for you?`;

        } catch (err: any) {
            console.error('[Vapi] getAvailableSlots error:', err);
            return `I could not check slots right now. ${err.message}`;
        }
    }

    // ─── 7. Get Doctors ───────────────────────────────────────────────────────
    async getDoctors(): Promise<string> {
        try {
            const clinicId = await this.getClinicId();
            const doctors = await prisma.doctor.findMany({
                where: { clinicId, isActive: true },
                orderBy: { name: 'asc' },
                select: { name: true, specialty: true },
            });

            if (!doctors.length) return `Please call during office hours for doctor information.`;

            const list = doctors.map(d => `Dr. ${d.name}${d.specialty ? ` (${d.specialty})` : ''}`).join(', ');
            return `Our available doctors: ${list}. Which doctor would you prefer?`;

        } catch (err: any) {
            console.error('[Vapi] getDoctors error:', err);
            return `I could not retrieve doctor information. ${err.message}`;
        }
    }

    // ─── 8. Record Complaint ──────────────────────────────────────────────────
    async recordComplaint(args: { patientPhone: string; complaint: string }): Promise<string> {
        try {
            const clinicId = await this.getClinicId();
            const phone = this.parsePhoneText(args.patientPhone || '');

            if (!phone) return `I have noted your concern: ${args.complaint}. Thank you.`;

            const patient = await prisma.patient.findFirst({ where: { phone, clinicId } });
            if (!patient) return `I have noted: ${args.complaint}. Our staff will be informed.`;

            await prisma.patient.update({
                where: { id: patient.id },
                data: { lastComplaint: args.complaint },
            });

            return `I have noted that you are coming in for ${args.complaint}. The doctor will be informed before your visit.`;

        } catch (err: any) {
            console.error('[Vapi] recordComplaint error:', err);
            return `I have noted your concern. Thank you.`;
        }
    }

    // ─── 9. Handle Call Ended ────────────────────────────────────────────────
    async handleCallEnded(payload: any): Promise<void> {
        try {
            const data = payload?.message || payload;
            const callId = data?.call?.id || data?.callId;
            const phone = this.getCallerPhone(data?.call);
            const transcript = data?.transcript || data?.artifact?.transcript || null;

            console.log(`[Vapi] Call ended | callId: ${callId} | phone: "${phone}"`);

            if (!callId) {
                console.warn('[Vapi] No callId found');
                return;
            }

            const clinicId = await this.getClinicId();

            const patient = phone
                ? await prisma.patient.findFirst({ where: { phone, clinicId } })
                : null;

            await prisma.call.upsert({
                where: { retellCallId: callId },
                create: {
                    clinicId,
                    patientId: patient?.id || null,
                    retellCallId: callId,
                    fromNumber: phone || null,
                    direction: 'inbound',
                    status: 'completed',
                    transcript,
                    endedAt: new Date(),
                },
                update: {
                    status: 'completed',
                    transcript,
                    endedAt: new Date(),
                    ...(patient?.id ? { patientId: patient.id } : {}),
                },
            });

            if (patient) {
                await prisma.patient.update({
                    where: { id: patient.id },
                    data: { lastVisitDate: new Date(), totalVisits: { increment: 1 } },
                });
            }

            console.log(`[Vapi] ✅ Call record saved | ${callId}`);

        } catch (err) {
            console.error('[Vapi] handleCallEnded error:', err);
        }
    }
}

export const vapiService = new VapiService();