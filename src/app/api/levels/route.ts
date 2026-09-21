import { NextRequest } from 'next/server';
import { ok, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const majorId = req.nextUrl.searchParams.get('majorId');
  if (!majorId) return apiError('مطلوب معرّف التخصص');

  const levels = await prisma.studyLevel.findMany({
    where: { majorId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return ok({ levels });
}