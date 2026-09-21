import { NextRequest } from 'next/server';
import { ok, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const stateId = req.nextUrl.searchParams.get('stateId');
  if (!stateId) return apiError('مطلوب معرّف الولاية');

  const universities = await prisma.university.findMany({
    where: { stateId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return ok({ universities });
}