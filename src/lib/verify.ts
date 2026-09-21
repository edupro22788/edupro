import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { sendMail } from './mail';
import { PLATFORM } from './constants';

export function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

/** إنشاء كود تفعيل وإرساله عبر البريد (أو عرضه في وضع الاختبار) */
export async function createAndSendCode(userId: string, email: string) {
  const plain = generateCode();
  const hash = await bcrypt.hash(plain, 10);

  await prisma.emailVerification.deleteMany({ where: { userId } });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await prisma.emailVerification.create({
    data: { userId, code: hash, expiresAt },
  });

  const mail = await sendMail({
    to: email,
    subject: `رمز تفعيل حسابك في ${PLATFORM.name}`,
    text: `مرحبًا،\nرمز التفعيل الخاص بك هو: ${plain}\nهذا الرمز صالح لمدة 15 دقيقة.\n\n${PLATFORM.name} — ${PLATFORM.tagline}`,
    html: `
      <div dir="rtl" style="font-family: Tahoma, sans-serif; background:#0b0e16; color:#f1ecdf; padding:28px; border-radius:14px; max-width:460px; margin:auto">
        <h2 style="color:#c9a962; margin:0 0 10px">${PLATFORM.name}</h2>
        <p style="line-height:1.8">مرحبًا، لتأكيد حسابك أدخل الرمز التالي:</p>
        <div style="font-size:30px; letter-spacing:8px; font-weight:800; color:#e8c87a; text-align:center; margin:18px 0; background:#11151f; border:1px solid rgba(201,169,98,.35); border-radius:12px; padding:14px">${plain}</div>
        <p style="color:#b2ada0; font-size:13px">هذا الرمز صالح لمدة 15 دقيقة.</p>
      </div>`,
  });

  return { plain, mail };
}