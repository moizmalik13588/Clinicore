import { Resend } from 'resend';
import { env } from '../../config/env';

let resend: Resend;

function getResend(): Resend {
  if (!resend) {
    console.log('[Email] Initializing Resend with key:', env.RESEND_API_KEY?.slice(0, 15) + '...');
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
}

const FORWARD_TO = 'clinicorefyp@gmail.com';

function otpEmailHtml(name: string, otp: string, purpose: string, expiryMin: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background:#f6f9fc; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0"
              style="background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="padding-bottom:24px; border-bottom:1px solid #eee;">
                  <h1 style="margin:0; font-size:22px; color:#1a1a2e;">🏥 Clinicore</h1>
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;">
                  <p style="margin:0 0 8px; color:#444; font-size:15px;">
                    Hello <strong>${name}</strong>,
                  </p>
                  <p style="margin:0 0 24px; color:#666; font-size:14px;">${purpose}</p>
                  <div style="
                    background:#f0f4ff;
                    border:2px dashed #4361ee;
                    border-radius:10px;
                    padding:24px;
                    text-align:center;
                    margin-bottom:24px;
                  ">
                    <p style="margin:0 0 8px; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:1px;">
                      Your verification code
                    </p>
                    <span style="font-size:40px; font-weight:bold; letter-spacing:10px; color:#1a1a2e;">
                      ${otp}
                    </span>
                  </div>
                  <p style="margin:0 0 8px; color:#888; font-size:13px;">
                    ⏱ Expires in <strong>${expiryMin} minutes</strong>.
                  </p>
                  <p style="margin:0; color:#bbb; font-size:12px;">
                    If you did not request this, ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:32px; border-top:1px solid #eee;">
                  <p style="margin:0; color:#ccc; font-size:11px; text-align:center;">
                    Clinicore Clinic OS — Automated Email
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

async function sendEmail(
  subject: string,
  name: string,
  otp: string,
  purpose: string,
  userEmail: string,
): Promise<void> {
  console.log('=== RESEND SENDING ===');
  console.log('FROM:', env.RESEND_FROM);
  console.log('TO:', FORWARD_TO);
  console.log('SUBJECT:', subject);
  console.log('USER EMAIL:', userEmail);

  try {
    const { data, error } = await getResend().emails.send({
      from: env.RESEND_FROM,
      to: [FORWARD_TO],
      subject,
      html: otpEmailHtml(name, otp, purpose, 10),
    });

    console.log('RESEND DATA:', JSON.stringify(data));
    console.log('RESEND ERROR:', JSON.stringify(error));
    console.log('=====================');

    if (error) {
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }

    console.log(`[Email] Sent successfully → ${FORWARD_TO} (user: ${userEmail})`);
  } catch (err) {
    console.error('[Email] CAUGHT ERROR:', err);
    throw err;
  }
}

export async function sendOtpEmail(
  to: string,
  name: string,
  otp: string,
): Promise<void> {
  await sendEmail(
    'Clinicore — Verify Your Email',
    name,
    otp,
    'Please use the code below to verify your email address and complete your registration.',
    to,
  );

}

export async function sendLoginOtpEmail(
  to: string,
  name: string,
  otp: string,
): Promise<void> {
  await sendEmail(
    'Clinicore — Your Login Code',
    name,
    otp,
    'Use the code below to complete your login. If you did not try to login, please secure your account.',
    to,
  );
}

// Existing sendOtpEmail + sendLoginOtpEmail ke saath yeh add karo:

// ─── Mood Report Email ────────────────────────────────────────────────────────
export interface MoodReportData {
  dateStr: string;
  totalCalls: number;
  totalMoodEvents: number;
  calmRate: number;
  angryRate: number;
  anxiousRate: number;
  frustratedRate: number;
  happyRate: number;
  flaggedCalls: number;
  dominantMood: string;
}

export async function sendMoodReportEmail(
  to: string,
  clinicName: string,
  data: MoodReportData,
): Promise<void> {

  const isAlert = data.angryRate > 30 || data.anxiousRate > 40;

  const subject = isAlert
    ? `⚠️ Clinicore — Mood Alert for ${clinicName}`
    : `📊 Clinicore — Daily Mood Report for ${clinicName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f6f9fc;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0"
            style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr><td style="padding-bottom:24px;border-bottom:1px solid #eee;">
              <h1 style="margin:0;font-size:20px;color:#1a1a2e;">🏥 Clinicore</h1>
              <p style="margin:4px 0 0;color:#666;font-size:13px;">
                ${isAlert ? '⚠️ Mood Alert' : '📊 Daily Mood Report'} — ${clinicName}
              </p>
            </td></tr>

            <!-- Date -->
            <tr><td style="padding:20px 0 16px;">
              <p style="margin:0;color:#444;font-size:14px;">
                Report for: <strong>${data.dateStr}</strong>
              </p>
            </td></tr>

            ${isAlert ? `
            <!-- Alert Banner -->
            <tr><td style="padding-bottom:20px;">
              <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px;">
                <p style="margin:0;color:#856404;font-size:13px;font-weight:bold;">
                  ⚠️ Attention Required — High negative mood detected
                </p>
                <p style="margin:6px 0 0;color:#856404;font-size:12px;">
                  ${data.angryRate > 30 ? `Anger rate is at ${data.angryRate}% (threshold: 30%). ` : ''}
                  ${data.anxiousRate > 40 ? `Anxiety rate is at ${data.anxiousRate}% (threshold: 40%).` : ''}
                </p>
              </div>
            </td></tr>
            ` : ''}

            <!-- Stats Table -->
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;color:#444;font-size:13px;">Total Calls</td>
                  <td style="padding:8px 0;color:#1a1a2e;font-size:13px;font-weight:bold;text-align:right;">${data.totalCalls}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#444;font-size:13px;">Mood Events</td>
                  <td style="padding:8px 0;color:#1a1a2e;font-size:13px;font-weight:bold;text-align:right;">${data.totalMoodEvents}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#444;font-size:13px;">Flagged Calls</td>
                  <td style="padding:8px 0;color:${data.flaggedCalls > 0 ? '#dc3545' : '#1a1a2e'};font-size:13px;font-weight:bold;text-align:right;">${data.flaggedCalls}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#444;font-size:13px;">Dominant Mood</td>
                  <td style="padding:8px 0;color:#1a1a2e;font-size:13px;font-weight:bold;text-align:right;">${data.dominantMood}</td>
                </tr>
              </table>
            </td></tr>

            <!-- Mood Bars -->
            <tr><td style="padding:20px 0 0;">
              <p style="margin:0 0 12px;color:#444;font-size:13px;font-weight:bold;">Mood Distribution</p>
              ${moodBar('😊 Calm', data.calmRate, '#28a745')}
              ${moodBar('😊 Happy', data.happyRate, '#17a2b8')}
              ${moodBar('😤 Frustrated', data.frustratedRate, '#fd7e14')}
              ${moodBar('😰 Anxious', data.anxiousRate, '#6f42c1', data.anxiousRate > 40)}
              ${moodBar('😡 Angry', data.angryRate, '#dc3545', data.angryRate > 30)}
            </td></tr>

            <!-- Footer -->
            <tr><td style="padding-top:28px;border-top:1px solid #eee;margin-top:28px;">
              <p style="margin:0;color:#999;font-size:11px;text-align:center;">
                Clinicore Clinic OS — Automated Daily Report
              </p>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to: [FORWARD_TO],
    subject,
    html,
  });

  if (error) {
    console.error('[Email] Mood report failed:', error);
    throw new Error(`Failed to send mood report: ${error.message}`);
  }

  console.log(`[Email] Mood report sent → ${FORWARD_TO} (clinic: ${clinicName})`);
}

// ─── Mood bar helper ──────────────────────────────────────────────────────────
function moodBar(
  label: string,
  percent: number,
  color: string,
  highlight: boolean = false,
): string {
  return `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:12px;color:${highlight ? '#dc3545' : '#555'};">${label}</span>
        <span style="font-size:12px;font-weight:bold;color:${highlight ? '#dc3545' : '#333'};">${percent}%${highlight ? ' ⚠️' : ''}</span>
      </div>
      <div style="background:#f0f0f0;border-radius:4px;height:8px;">
        <div style="background:${color};width:${percent}%;height:8px;border-radius:4px;"></div>
      </div>
    </div>
  `;
}