import { NextRequest } from 'next/server';
import { ok, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const majorId = req.nextUrl.searchParams.get('majorId');
  const facultyId = req.nextUrl.searchParams.get('facultyId');
  if (!majorId && !facultyId) return apiError('مطلوب معرّف التخصص أو الكلية');

  // مستوى داخل كلية معينة: كل المستويات عبر التخصصات (بدون تكرار بنفس الاسم)
  if (facultyId) {
    const majors = await prisma.major.findMany({ where: { facultyId }, select: { id: true } });
    const levels = await prisma.studyLevel.findMany({
      where: { majorId: { in: majors.map((m) => m.id) } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    const seen = new Set<string>();
    const levelsByFaculty = levels.filter((l) => {
      if (seen.has(l.name)) return false;
      seen.add(l.name);
      return true;
    });
    return ok({ levels: levelsByFaculty });
  }

  const levels = await prisma.studyLevel.findMany({
    where: { majorId: majorId! },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return ok({ levels });
}