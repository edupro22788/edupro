import { NextRequest } from 'next/server';
import { ok, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const facultyId = req.nextUrl.searchParams.get('facultyId');
  const levelName = req.nextUrl.searchParams.get('levelName');
  if (!facultyId) return apiError('مطلوب معرّف الكلية');

  // فرع ضمن كلية بمستوى محدد: يعيد للمجرة أيضًا معرّف المستوى الخاص بها
  if (levelName) {
    const majors = await prisma.major.findMany({
      where: { facultyId, levels: { some: { name: levelName } } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, levels: { where: { name: levelName }, select: { id: true } } },
    });
    return ok({
      majors: majors.map((m) => ({
        id: m.id,
        name: m.name,
        levelId: m.levels[0]?.id || null,
      })),
    });
  }

  const majors = await prisma.major.findMany({
    where: { facultyId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return ok({ majors });
}