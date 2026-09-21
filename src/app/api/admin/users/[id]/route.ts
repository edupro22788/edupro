import { NextRequest } from 'next/server';
import { requireApiAdmin, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let admin = await requireApiAdmin().catch((e: unknown) => e as ApiGuardError);
  if (admin instanceof ApiGuardError) return admin.response;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || '');

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return apiError('المستخدم غير موجود', 404);

  if (action === 'make-admin') {
    if (target.id === admin.id) return apiError('أنت مدير بالفعل');
    await prisma.user.update({ where: { id }, data: { role: 'ADMIN' } });
    return ok();
  }

  if (action === 'make-student') {
    await prisma.user.update({ where: { id }, data: { role: 'STUDENT' } });
    return ok();
  }

  if (action === 'verify') {
    await prisma.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
    return ok();
  }

  return apiError('إجراء غير صالح', 400);
}