import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError, isApiSupervisor } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyGroup } from '@/lib/notifications';
import { DAYS } from '@/lib/constants';

export async function GET() {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const entries = await prisma.weeklySchedule.findMany({
    where: { groupId: user.membership!.groupId },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
  });
  return ok({ entries });
}

export async function POST(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;
  if (!isApiSupervisor(user)) return apiError('فقط مشرف الفوج يعدّل الجدول', 403);

  const body = await req.json().catch(() => ({}));
  const day = Number(body?.day);
  const startTime = String(body?.startTime || '');
  const endTime = String(body?.endTime || '');
  const subjectName = String(body?.subjectName || '').trim();

  if (!Number.isInteger(day) || day < 0 || day > 6) return apiError('اليوم غير صالح');
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return apiError('أوقات غير صالحة (HH:MM)');
  }
  if (startTime >= endTime) return apiError('وقت البداية يجب أن يسبق النهاية');
  if (!subjectName || subjectName.length > 80) return apiError('أدخل اسم المقياس');

  const entry = await prisma.weeklySchedule.create({
    data: {
      groupId: user.membership!.groupId,
      day,
      startTime,
      endTime,
      subjectName,
      professorName: String(body?.professorName || '').trim().slice(0, 80) || null,
      room: String(body?.room || '').trim().slice(0, 40) || null,
      createdBy: user.id,
    },
  });

await notifyGroup({
      groupId: user.membership!.groupId,
      type: 'SCHEDULE_UPDATED',
      title: 'تحديث في الجدول 🗓️',
      body: `${DAYS[day]} ${startTime}-${endTime}: ${subjectName}`,
      link: '/room/schedule',
      excludeUserId: user.id,
    });

  return ok({ entry });
}