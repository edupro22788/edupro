import { NextRequest } from 'next/server';
import { ok, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const facultyId = req.nextUrl.searchParams.get('facultyId');
  if (!facultyId) return apiError('مطلوب معرّف الكلية');

  const majors = await prisma.major.findMany({
    where: { facultyId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return ok({ majors });
}