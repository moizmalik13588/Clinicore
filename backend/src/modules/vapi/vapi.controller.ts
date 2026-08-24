import { Request, Response } from 'express';
import { vapiService } from './vapi.service';
import {
    VapiToolCallPayload,
    VapiToolResult,
} from './vapi.types';

export class VapiController {

    // ─────────────────────────────────────────────────────────────
    // POST /vapi/tools
    // ─────────────────────────────────────────────────────────────
    handleToolCall = async (req: Request, res: Response): Promise<void> => {
        try {
            const payload = req.body as VapiToolCallPayload;

            const toolCalls = payload?.message?.toolCallList ?? [];
            const call = payload?.message?.call;

            console.log(
                `[Vapi Tools] ${toolCalls
                    .map(t => t?.function?.name ?? 'unknown')
                    .join(', ')}`
            );

            const results: VapiToolResult['results'] = [];

            for (const toolCall of toolCalls) {

                const name = toolCall?.function?.name ?? 'unknown';

                let args: any = {};
                const rawArgs = toolCall?.function?.arguments;

                if (typeof rawArgs === 'string') {
                    try {
                        args = JSON.parse(rawArgs || '{}');
                    } catch (parseErr) {
                        console.error(`[Vapi] JSON parse failed for ${name}:`, parseErr);
                        args = {};
                    }
                } else if (rawArgs && typeof rawArgs === 'object') {
                    args = rawArgs;
                } else {
                    args = {};
                }

                console.log(`[Vapi] ${name} final args:`, JSON.stringify(args));

                // Auto inject caller phone
                const callerPhone = vapiService.getCallerPhone(call);

                console.log(`[Vapi] Caller phone: ${callerPhone}`); // ← add karo

                if (callerPhone) {
                    if (!args.patientPhone) args.patientPhone = callerPhone;
                    if (!args.phone) args.phone = callerPhone;
                }

                let result = '';

                switch (name) {

                    case 'bookAppointment':
                        result = await vapiService.bookAppointment(args);
                        break;

                    case 'cancelAppointment':
                        result = await vapiService.cancelAppointment(args);
                        break;

                    case 'checkAppointments':
                        result = await vapiService.checkAppointments(args);
                        break;

                    case 'getAvailableSlots':
                        result = await vapiService.getAvailableSlots(args);
                        break;

                    case 'getPatientInfo':
                        result = await vapiService.getPatientInfo(args);
                        break;

                    case 'registerPatient':
                        result = await vapiService.registerPatient(args);
                        break;

                    case 'getDoctors':
                        result = await vapiService.getDoctors();
                        break;

                    case 'recordComplaint':
                        result = await vapiService.recordComplaint(args);
                        break;

                    default:
                        result = `Function ${name} is not available.`;
                        console.warn(`[Vapi] Unknown tool: ${name}`);
                }

                results.push({
                    toolCallId: toolCall?.id ?? 'unknown',
                    result,
                });

                console.log(`[Vapi] ${name} args:`, JSON.stringify(args));

                console.log(
                    `[Vapi] ${name} -> ${(result ?? '').toString().slice(0, 80)}`
                );
            }

            res.status(200).json({ results });

        } catch (err) {
            console.error('[Vapi] Tool call error:', err);

            res.status(200).json({
                results: [
                    {
                        toolCallId: 'error',
                        result:
                            'I am sorry, something went wrong. Please try again.',
                    },
                ],
            });
        }
    };

    // ─────────────────────────────────────────────────────────────
    // POST /vapi/events
    // ─────────────────────────────────────────────────────────────
    handleEvent = async (req: Request, res: Response): Promise<void> => {

        // Respond immediately
        res.status(200).json({ received: true });

        try {

            const payload = req.body ?? {};

            // Safe stringify
            let rawPayload = '';

            try {
                rawPayload = JSON.stringify(payload) ?? '';
            } catch {
                rawPayload = '[Unable to stringify payload]';
            }

            const type =
                payload?.message?.type ??
                payload?.type ??
                payload?.event?.type ??
                'unknown';

            console.log('==========================================');
            console.log('[Vapi Event]');
            console.log('Type :', type);
            console.log('Body :', rawPayload.substring(0, 500));
            console.log('==========================================');

            setImmediate(async () => {

                try {

                    switch (type) {

                        case 'end-of-call-report':
                            await vapiService.handleCallEnded(payload);
                            break;

                        case 'call-start':
                        case 'call-started':
                        case 'status-update':
                        case 'assistant-request':
                        case 'speech-update':
                        case 'conversation-update':
                        case 'tool-calls':
                            console.log(`[Vapi] Event received: ${type}`);
                            break;

                        case 'transcript':
                        case 'transcript-update':
                            console.log('[Vapi] Transcript received');
                            break;

                        case 'hang':
                        case 'call-ended':
                            console.log('[Vapi] Call ended');
                            break;

                        default:
                            console.log(
                                `[Vapi] Unknown event type: ${type}`
                            );
                    }

                } catch (err) {
                    console.error(
                        '[Vapi] Event processing error:',
                        err
                    );
                }

            });

        } catch (err) {
            console.error('[Vapi] Event error:', err);
        }
    };
}

export const vapiController = new VapiController();