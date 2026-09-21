import { NextRequest } from 'next/server';
import { ok, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const universityId = req.nextUrl.searchParams.get('universityId');
  if (!universityId) return apiError('مطلوب معرّف الجامعة');

  const faculties = await prisma.faculty.findMany({
    where: { universityId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return ok({ faculties });
}