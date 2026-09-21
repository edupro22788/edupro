import { createTransport, type Transporter } from 'nodemailer';

const mode = process.env.MAIL_MODE || 'test';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (mode !== 'smtp') return null;
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }
  return transporter;
}

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail({ to, subject, text, html }: SendMailInput) {
  const fromRaw = process.env.MAIL_FROM || 'EDU PRO <no-reply@edupro.dz>';
  const from = {
    name: fromRaw.includes('<') ? fromRaw.split('<')[0].trim() : fromRaw,
    address: fromRaw.includes('<') ? fromRaw.split('<')[1].replace('>', '') : fromRaw,
  };

  if (mode === 'smtp') {
    const t = getTransporter();
    if (!t) {
      console.warn('[mail] SMTP غير مهيأ — سيتم عرض الرمز في السجل');
    } else {
      await t.sendMail({ from, to, subject, text, html });
      return { mode: 'smtp' as const };
    }
  }

  // الوضع التجريبي: لا إرسال حقيقي
  console.log('[EDU PRO][test-mail] إلى:', to, '| الموضوع:', subject);
  console.log('[EDU PRO][test-mail] النص:', text);
  return { mode: 'test' as const };
}