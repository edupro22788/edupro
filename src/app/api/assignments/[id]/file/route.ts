import { NextRequest } from 'next/server';
import { requireApiGroupMember, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { resolveStoredPath, readStoredFile, statStoredFile } from '@/lib/storage';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const { id } = await ctx.params;
  const assignment = await prisma.assignment.findFirst({
    where: { id, groupId: user.membership!.groupId, status: 'PUBLISHED' },
  });
  if (!assignment || !assignment.storedPath) return apiError('الملف غير موجود', 404);

  const absolute = resolveStoredPath(assignment.storedPath);
  if (!absolute) return apiError('تعذر العثور على الملف', 404);
  const stat = statStoredFile(absolute);
  if (!stat) return apiError('تعذر قراءة الملف', 500);

  const safeName = (assignment.fileName || 'attachment').replace(/"/g, '');
  const buf = readStoredFile(absolute);
  if (!buf) return apiError('تعذر قراءة الملف', 500);

  const response = new Response(new Uint8Array(buf));
  response.headers.set('Content-Type', assignment.mimeType || 'application/octet-stream');
  response.headers.set('Content-Length', String(stat.size));
  response.headers.set(
    'Content-Disposition',
    `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}