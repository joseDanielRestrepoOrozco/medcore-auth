import nodemailer from 'nodemailer';
import { BRAND_NAME, MAIL_FROM, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_SECURE, SMTP_USER } from './config.js';
import { renderVerificationEmail } from './emailTemplates.js';

type SendResult = { messageId: string; previewUrl?: string };

async function getTransport() {
  if (SMTP_HOST && SMTP_PORT) {
    const base: any = {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE || SMTP_PORT === 465,
    };
    if (SMTP_USER && SMTP_PASS) {
      base.auth = { user: SMTP_USER, pass: SMTP_PASS };
    }
    const transporter = nodemailer.createTransport(base);
    return { transporter, preview: false } as const;
  }

  // Fallback a Ethereal (solo desarrollo)
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return { transporter, preview: true } as const;
}

export async function sendVerificationEmail(to: string, code: string, verifyUrl?: string): Promise<SendResult> {
  const { transporter, preview } = await getTransport();
  const html = renderVerificationEmail({ brand: BRAND_NAME, code, verifyUrl });
  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: `Verifica tu correo - ${BRAND_NAME}`,
    text: `Tu código de verificación es: ${code}${verifyUrl ? `\n\nVerificar ahora: ${verifyUrl}` : ''}`,
    html,
  });

  const result: SendResult = { messageId: info.messageId };
  if (preview) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) result.previewUrl = url;
  }
  return result;
}
