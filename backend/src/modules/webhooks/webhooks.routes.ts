import { Router, Request, Response } from 'express';
import { webhookRateLimit } from '../../common/middleware/rate-limit.middleware';
import { webhookService } from './webhook.service';
import { smsService } from '../sms/sms.service';
import { prisma } from '../../db/client';
import { env } from '../../config/env';

const router = Router();
router.use(webhookRateLimit);

// ─── Raw body middleware — signature verify ke liye ───────────────────────────
function rawBody() {
  return (req: Request, _res: Response, next: any) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
    req.on('end', () => {
      (req as any).rawBody = raw;
      try { req.body = JSON.parse(raw); } catch { req.body = {}; }
      next();
    });
  };
}

// ─── POST /webhooks/retell ────────────────────────────────────────────────────
router.post('/retell', rawBody(), async (req: Request, res: Response) => {
  res.status(200).json({ received: true });

  try {
    const event = req.body;
    const call = event?.call;

    console.log(`[Webhook] event: ${event?.event} | call_id: ${call?.call_id}`);

    switch (event?.event) {
      case 'call_started':
        await webhookService.handleCallStarted({
          callId: call.call_id,
          agentId: call.agent_id || '',
          fromNumber: call.from_number || '',
          toNumber: call.to_number || '',
          direction: call.direction || 'inbound',
          startedAt: new Date(call.start_timestamp || Date.now()),
          metadata: call.metadata,
        });
        break;

      case 'call_ended':
        await webhookService.handleCallEnded({
          callId: call.call_id,
          fromNumber: call.from_number || '',
          endedAt: new Date(call.end_timestamp || Date.now()),
          durationMs: call.duration_ms || 0,
          transcript: call.transcript,
          analysis: call.call_analysis ? {
            callSummary: call.call_analysis.call_summary,
            userSentiment: call.call_analysis.user_sentiment,
            callSuccessful: call.call_analysis.call_successful,
          } : undefined,
        });
        break;

      case 'call_analyzed':
        await webhookService.handleCallAnalyzed(call.call_id, call.call_analysis);
        break;
    }
  } catch (err) {
    console.error('[Webhook] Error:', err);
  }
});

// ─── POST /webhooks/retell/transcript ─────────────────────────────────────────
router.post('/retell/transcript', rawBody(), async (req: Request, res: Response) => {
  res.status(200).json({ received: true });

  try {
    const body = req.body;
    if (!body.call_id || !body.transcript) return;

    const lastWords = body.transcript
      .slice(-5)
      .map((t: any) => t.content)
      .join(' ');

    setImmediate(() => {
      webhookService.handleTranscriptUpdate({
        callId: body.call_id,
        transcript: body.transcript,
        lastWords,
      }).catch(err => console.error('[Transcript] Error:', err));
    });
  } catch (err) {
    console.error('[Transcript] Error:', err);
  }
});

// ─── POST /webhooks/twilio/sms ────────────────────────────────────────────────
router.post('/twilio/sms', async (req: Request, res: Response) => {
  try {
    const { From: from, Body: body, To: to } = req.body;

    if (!from || !body) {
      res.status(200).type('text/xml').send('<Response/>');
      return;
    }

    const clinic = await prisma.clinic.findFirst({ where: { phone: to } }).catch(() => null);
    const clinicId = clinic?.id || env.CLINIC_ID || '';

    if (!clinicId) {
      res.status(200).type('text/xml').send('<Response/>');
      return;
    }

    const replyText = await smsService.handleIncomingSms(from, body, clinicId);

    res.status(200).type('text/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyText}</Message></Response>`
    );
  } catch (err) {
    console.error('[Twilio SMS]', err);
    res.status(200).type('text/xml').send('<Response/>');
  }
});

// ─── POST /webhooks/twilio/voice ──────────────────────────────────────────────
router.post('/twilio/voice', (_req: Request, res: Response) => {
  res.status(200).type('text/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling. Please hold.</Say></Response>`
  );
});

export default router;