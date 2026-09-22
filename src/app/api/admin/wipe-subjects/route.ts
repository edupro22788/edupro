import { prisma } from '@/lib/prisma';
import { requireApiAdmin, ok } from '@/lib/api-helpers';

export const runtime = 'nodejs';

export async function POST() {
  await requireApiAdmin();
  const [delFiles, detachAssignments, delSubjects] = await prisma.$transaction([
    prisma.studyFile.deleteMany({ where: { subjectId: { not: null } } }),
    prisma.assignment.updateMany({ where: { subjectId: { not: null } }, data: { subjectId: null } }),
    prisma.subject.deleteMany({}),
  ]);
  return ok({ deletedFiles: delFiles.count, detachedAssignments: detachAssignments.count, deletedSubjects: delSubjects.count });
}