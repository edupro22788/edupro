import { requireApiAdmin, ok, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const admin = await requireApiAdmin().catch((e: unknown) => e as ApiGuardError);
  if (admin instanceof ApiGuardError) return admin.response;

  const [
    users,
    states,
    universities,
    faculties,
    majors,
    levels,
    groups,
    files,
    pendingFiles,
    reports,
    elections,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.state.count(),
    prisma.university.count(),
    prisma.faculty.count(),
    prisma.major.count(),
    prisma.studyLevel.count(),
    prisma.group.count(),
    prisma.studyFile.count(),
    prisma.studyFile.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.election.count({ where: { status: 'OPEN' } }),
  ]);

  return ok({
    counts: {
      users,
      states,
      universities,
      faculties,
      majors,
      levels,
      groups,
      files,
      pendingFiles,
      reports,
      elections,
    },
  });
}