import { NextRequest } from 'next/server';
import { getApiUser, ok, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyGroup } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return apiError('يجب تسجيل الدخول', 401);
    if (!user.emailVerifiedAt) return apiError('يجب تأكيد بريدك الإلكتروني أولًا', 403, 'EMAIL_NOT_VERIFIED');
    if (user.membership) return apiError('أنت بالفعل عضو في فوج', 409);

    const body = await req.json().catch(() => ({}));
    const groupId = String(body?.groupId || '');
    const newGroupName = String(body?.newGroupName || '').trim();
    const studyLevelId = String(body?.studyLevelId || '');

    let groupIdFinal = groupId;

    if (groupId) {
      const group = await prisma.group.findUnique({ where: { id: groupId } });
      if (!group) return apiError('الفوج غير موجود', 404);
      groupIdFinal = group.id;
    } else {
      if (!studyLevelId) return apiError('حدد المستوى الدراسي', 400);
      const name = newGroupName || 'الفوج 01';
      const level = await prisma.studyLevel.findUnique({ where: { id: studyLevelId } });
      if (!level) return apiError('المستوى غير موجود', 404);
      const group = await prisma.group.upsert({
        where: { studyLevelId_name: { studyLevelId, name } },
        update: {},
        create: { studyLevelId, name },
      });
      groupIdFinal = group.id;
    }

    await prisma.membership.create({ data: { userId: user.id, groupId: groupIdFinal } });

    await notifyGroup({
      groupId: groupIdFinal,
      type: 'SYSTEM',
      title: 'انضم عضو جديد 🎉',
      body: `انضم ${user.firstName} ${user.lastName} إلى الفوج`,
      link: '/room/chat',
      excludeUserId: user.id,
    });

    return ok({ groupId: groupIdFinal });
  } catch (e) {
    console.error(e);
    return apiError('تعذر إتمام الانضمام', 500);
  }
}