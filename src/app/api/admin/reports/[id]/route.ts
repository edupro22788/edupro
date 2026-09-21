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

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return apiError('البلاغ غير موجود', 404);

  if (action === 'resolve') {
    await prisma.report.update({
      where: { id },
      data: { status: 'RESOLVED', handledById: admin.id, handledAt: new Date() },
    });
    return ok();
  }

  if (action === 'dismiss') {
    await prisma.report.update({
      where: { id },
      data: { status: 'DISMISSED', handledById: admin.id, handledAt: new Date() },
    });
    return ok();
  }

  return apiError('إجراء غير صالح', 400);
}