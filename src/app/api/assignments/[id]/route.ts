import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError, isApiSupervisor } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { deleteStoredFile } from '@/lib/storage';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const { id } = await ctx.params;
  const assignment = await prisma.assignment.findFirst({
    where: { id, groupId: user.membership!.groupId },
  });
  if (!assignment) return apiError('الواجب غير موجود', 404);

  const body = await req.json().catch(() => ({}));

  if (body.action === 'delete') {
    const allowed = assignment.uploaderId === user.id || isApiSupervisor(user);
    if (!allowed) return apiError('غير مصرح لك بحذف هذا الواجب', 403);
    await prisma.assignment.update({ where: { id }, data: { status: 'DELETED' } });
    if (!assignment.storedPath) deleteStoredFile(assignment.storedPath);
    return ok();
  }

  if (assignment.uploaderId === user.id && typeof body.title === 'string' && body.title.trim()) {
    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        title: body.title.trim().slice(0, 120),
        ...(typeof body.description === 'string'
          ? { description: body.description.trim().slice(0, 1000) }
          : {}),
      },
    });
    return ok({ assignment: updated });
  }

  return apiError('غير مصرح لك', 403);
}