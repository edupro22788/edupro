import { NextRequest } from 'next/server';
import { requireApiAdmin, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { normalizeGroupName } from '@/lib/group-name';

export async function GET(req: NextRequest) {
  let admin = await requireApiAdmin().catch((e: unknown) => e as ApiGuardError);
  if (admin instanceof ApiGuardError) return admin.response;

  const sp = req.nextUrl.searchParams;
  const kind = sp.get('kind');

  if (kind === 'states') {
    const states = await prisma.state.findMany({ orderBy: { order: 'asc' } });
    return ok({ states });
  }

  const stateId = sp.get('stateId');
  if (kind === 'universities' && stateId) {
    const universities = await prisma.university.findMany({
      where: { stateId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { faculties: true } } },
    });
    return ok({ universities });
  }

  const universityId = sp.get('universityId');
  if (kind === 'faculties' && universityId) {
    const faculties = await prisma.faculty.findMany({
      where: { universityId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { majors: true } } },
    });
    return ok({ faculties });
  }

  const facultyId = sp.get('facultyId');
  if (kind === 'majors' && facultyId) {
    const majors = await prisma.major.findMany({
      where: { facultyId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { levels: true } } },
    });
    return ok({ majors });
  }

  const majorId = sp.get('majorId');
  if (kind === 'levels' && majorId) {
    const levels = await prisma.studyLevel.findMany({
      where: { majorId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { groups: true } },
      },
    });
    return ok({ levels });
  }

  const levelId = sp.get('levelId');
  if (kind === 'groups' && levelId) {
    const groups = await prisma.group.findMany({
      where: { studyLevelId: levelId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { memberships: true } },
      },
    });
    return ok({ groups });
  }

  return apiError('معاملات غير كافية', 400);
}

export async function POST(req: NextRequest) {
  let admin = await requireApiAdmin().catch((e: unknown) => e as ApiGuardError);
  if (admin instanceof ApiGuardError) return admin.response;

  const body = await req.json().catch(() => ({}));
  const kind = String(body?.kind || '');
  const name = String(body?.name || '').trim();
  if (!name) return apiError('أدخل الاسم');

  try {
    if (kind === 'state') {
      const maxOrder = await prisma.state.aggregate({ _max: { order: true } });
      const state = await prisma.state.create({
        data: { name, order: (maxOrder._max.order ?? 0) + 1 },
      });
      return ok({ node: state });
    }

    if (kind === 'university') {
      if (!body.stateId) return apiError('مطلوب معرّف الولاية');
      const node = await prisma.university.create({ data: { name, stateId: body.stateId } });
      return ok({ node });
    }

    if (kind === 'faculty') {
      if (!body.universityId) return apiError('مطلوب معرّف الجامعة');
      const node = await prisma.faculty.create({ data: { name, universityId: body.universityId } });
      return ok({ node });
    }

    if (kind === 'major') {
      if (!body.facultyId) return apiError('مطلوب معرّف الكلية');
      const node = await prisma.major.create({ data: { name, facultyId: body.facultyId } });
      return ok({ node });
    }

    if (kind === 'level') {
      if (!body.majorId) return apiError('مطلوب معرّف التخصص');
      const node = await prisma.studyLevel.create({ data: { name, majorId: body.majorId } });
      return ok({ node });
    }

    if (kind === 'group') {
      if (!body.levelId) return apiError('مطلوب معرّف المستوى');
      const level = await prisma.studyLevel.findUnique({ where: { id: body.levelId } });
      if (!level) return apiError('المستوى غير موجود', 404);
      const gName = normalizeGroupName(name);
      const node = await prisma.group.upsert({
        where: { studyLevelId_name: { studyLevelId: body.levelId, name: gName } },
        update: {},
        create: { name: gName, studyLevelId: body.levelId },
      });
      return ok({ node });
    }

    return apiError('نوع العقدة غير صالح', 400);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === 'P2002') return apiError('يوجد عنصر بنفس الاسم في هذا المستوى', 409);
    throw e;
  }
}