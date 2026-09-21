import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyGroup } from '@/lib/notifications';
import { ANNOUNCEMENT_TYPES } from '@/lib/constants';

export async function GET() {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const announcements = await prisma.announcement.findMany({
    where: { groupId: user.membership!.groupId, status: { not: 'DELETED' } },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      author: { select: { id: true, firstName: true, lastName: true, gender: true } },
    },
    take: 100,
  });
  return ok({ announcements });
}

export async function POST(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const body = await req.json().catch(() => ({}));
  const title = String(body?.title || '').trim();
  const content = String(body?.content || '').trim();
  const typeRaw = String(body?.type || 'IMPORTANT');

  if (!title || title.length > 120) return apiError('أدخل عنوان الإعلان');
  if (!content) return apiError('أدخل نص الإعلان');
  if (content.length > 3000) return apiError('الإعلان طويل جدًا');
  if (!(typeRaw in ANNOUNCEMENT_TYPES)) return apiError('نوع الإعلان غير صالح');

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      type: typeRaw as never,
      groupId: user.membership!.groupId,
      authorId: user.id,
    },
    include: { author: { select: { id: true, firstName: true, lastName: true, gender: true } } },
  });

await notifyGroup({
      groupId: user.membership!.groupId,
      type: 'ANNOUNCEMENT',
      title: `إعلان: ${announcement.title} 📢`,
      body: content.slice(0, 120),
      link: '/room/announcements',
      excludeUserId: user.id,
    });

  return ok({ announcement });
}