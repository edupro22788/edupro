import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyGroup } from '@/lib/notifications';
import { SUBJECT_ICONS } from '@/lib/constants';

export async function GET() {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const subjects = await prisma.subject.findMany({
    where: { groupId: user.membership!.groupId },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { files: { where: { status: 'PUBLISHED' } } } },
    },
  });
  return ok({ subjects });
}

export async function POST(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || '').trim();
  if (!name || name.length > 80) return apiError('أدخل اسم مقياس صحيح');

  const icon = SUBJECT_ICONS.some((i) => i.key === body?.icon) ? body.icon : 'academic';
  const color = /^#[0-9a-fA-F]{6}$/.test(String(body?.color || '')) ? body.color : '#c9a962';

  const subject = await prisma.subject.create({
    data: { name, icon, color, groupId: user.membership!.groupId, createdById: user.id },
  });

await notifyGroup({
      groupId: user.membership!.groupId,
      type: 'SUBJECT_ADDED',
      title: 'مقياس جديد 📚',
      body: `أضاف ${user.firstName} ${user.lastName} مقياسًا: ${name}`,
      link: '/room/subjects',
    });

  return ok({ subject });
}