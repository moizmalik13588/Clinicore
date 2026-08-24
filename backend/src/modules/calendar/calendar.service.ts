import { google, calendar_v3 } from 'googleapis';
import { prisma } from '../../db/client';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/app.error';

// ─── OAuth2 client singleton ──────────────────────────────────────────────────
function getOAuth2Client() {
    return new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI,
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CalendarEventData {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail?: string;
}

export interface CalendarEventResult {
    eventId: string;
    htmlLink: string;
    startTime: string;
    endTime: string;
}

export class CalendarService {

    // ─── Get OAuth URL ────────────────────────────────────────────────────────
    getAuthUrl(): string {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
            throw new AppError('Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env', 503);
        }

        const oauth2Client = getOAuth2Client();

        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
            ],
        });
    }

    // ─── Handle OAuth callback ────────────────────────────────────────────────
    async handleCallback(code: string, clinicId: string): Promise<void> {
        const oauth2Client = getOAuth2Client();

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token || !tokens.refresh_token) {
            throw new AppError('Google OAuth failed — no tokens received', 400);
        }

        // Tokens DB mein save karo
        await prisma.googleToken.upsert({
            where: { clinicId },
            create: {
                clinicId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: BigInt(tokens.expiry_date || 0),
            },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: BigInt(tokens.expiry_date || 0),
            },
        });

        console.log(`[Calendar] Google OAuth tokens saved for clinic: ${clinicId}`);
    }

    // ─── Get authenticated client ─────────────────────────────────────────────
    private async getAuthenticatedClient(clinicId: string) {
        const stored = await prisma.googleToken.findUnique({
            where: { clinicId },
        });

        if (!stored) {
            throw new AppError(
                'Google Calendar not connected. Visit /auth/google to authorize.',
                400,
            );
        }

        const oauth2Client = getOAuth2Client();

        oauth2Client.setCredentials({
            access_token: stored.accessToken,
            refresh_token: stored.refreshToken,
            expiry_date: Number(stored.expiryDate),
        });

        // Token refresh listener
        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                await prisma.googleToken.update({
                    where: { clinicId },
                    data: {
                        accessToken: tokens.access_token,
                        expiryDate: BigInt(tokens.expiry_date || 0),
                    },
                });
                console.log(`[Calendar] Token refreshed for clinic: ${clinicId}`);
            }
        });

        return oauth2Client;
    }

    // ─── Create Calendar Event ────────────────────────────────────────────────
    async createEvent(
        clinicId: string,
        eventData: CalendarEventData,
    ): Promise<CalendarEventResult | null> {
        try {
            const auth = await this.getAuthenticatedClient(clinicId);
            const calendar = google.calendar({ version: 'v3', auth });

            const event: calendar_v3.Schema$Event = {
                summary: eventData.title,
                description: eventData.description,
                start: {
                    dateTime: eventData.startTime.toISOString(),
                    timeZone: 'Asia/Karachi',
                },
                end: {
                    dateTime: eventData.endTime.toISOString(),
                    timeZone: 'Asia/Karachi',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 }, // 24h before
                        { method: 'popup', minutes: 30 },       // 30 min before
                    ],
                },
            };

            // Attendee add karo agar email hai
            if (eventData.attendeeEmail) {
                event.attendees = [{ email: eventData.attendeeEmail }];
            }

            const res = await calendar.events.insert({
                calendarId: env.GOOGLE_CALENDAR_ID,
                requestBody: event,
            });

            console.log(`[Calendar] Event created: ${res.data.id}`);

            return {
                eventId: res.data.id!,
                htmlLink: res.data.htmlLink!,
                startTime: res.data.start?.dateTime!,
                endTime: res.data.end?.dateTime!,
            };

        } catch (err: any) {
            // Calendar fail ho to appointment block nahi hona chahiye
            console.error('[Calendar] Create event failed:', err.message);
            return null;
        }
    }

    // ─── Update Calendar Event ────────────────────────────────────────────────
    async updateEvent(
        clinicId: string,
        eventId: string,
        eventData: Partial<CalendarEventData>,
    ): Promise<void> {
        try {
            const auth = await this.getAuthenticatedClient(clinicId);
            const calendar = google.calendar({ version: 'v3', auth });

            const patch: calendar_v3.Schema$Event = {};

            if (eventData.title) patch.summary = eventData.title;
            if (eventData.description) patch.description = eventData.description;
            if (eventData.startTime) {
                patch.start = {
                    dateTime: eventData.startTime.toISOString(),
                    timeZone: 'Asia/Karachi',
                };
            }
            if (eventData.endTime) {
                patch.end = {
                    dateTime: eventData.endTime.toISOString(),
                    timeZone: 'Asia/Karachi',
                };
            }

            await calendar.events.patch({
                calendarId: env.GOOGLE_CALENDAR_ID,
                eventId,
                requestBody: patch,
            });

            console.log(`[Calendar] Event updated: ${eventId}`);
        } catch (err: any) {
            console.error('[Calendar] Update event failed:', err.message);
        }
    }

    // ─── Delete Calendar Event ────────────────────────────────────────────────
    async deleteEvent(clinicId: string, eventId: string): Promise<void> {
        try {
            const auth = await this.getAuthenticatedClient(clinicId);
            const calendar = google.calendar({ version: 'v3', auth });

            await calendar.events.delete({
                calendarId: env.GOOGLE_CALENDAR_ID,
                eventId,
            });

            console.log(`[Calendar] Event deleted: ${eventId}`);
        } catch (err: any) {
            console.error('[Calendar] Delete event failed:', err.message);
        }
    }

    // ─── Check if connected ───────────────────────────────────────────────────
    async isConnected(clinicId: string): Promise<boolean> {
        const token = await prisma.googleToken.findUnique({ where: { clinicId } });
        return !!token;
    }
}

export const calendarService = new CalendarService();