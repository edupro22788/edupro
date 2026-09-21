import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError, isApiSupervisor } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { SUBJECT_ICONS } from '@/lib/constants';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;
  if (!isApiSupervisor(user)) return apiError('غير مصرح لك', 403);

  const { id } = await ctx.params;
  const subject = await prisma.subject.findFirst({
    where: { id, groupId: user.membership!.groupId },
  });
  if (!subject) return apiError('المقياس غير موجود', 404);

  const body = await req.json().catch(() => ({}));
  const data: { name?: string; icon?: string; color?: string; active?: boolean } = {};

  if (typeof body.name === 'string' && body.name.trim()) {
    const name = body.name.trim();
    if (name.length > 80) return apiError('اسم المقياس طويل جدًا');
    data.name = name;
  }
  if (SUBJECT_ICONS.some((i) => i.key === body.icon)) data.icon = body.icon;
  if (/^#[0-9a-fA-F]{6}$/.test(String(body.color || ''))) data.color = body.color;
  if (typeof body.active === 'boolean') data.active = body.active;

  const updated = await prisma.subject.update({
    where: { id },
    data,
  });
  return ok({ subject: updated });
}