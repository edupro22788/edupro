import { requireApiAdmin, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let admin = await requireApiAdmin().catch((e: unknown) => e as ApiGuardError);
  if (admin instanceof ApiGuardError) return admin.response;

  const reports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      reporter: { select: { id: true, firstName: true, lastName: true } },
      group: { select: { id: true, name: true } },
    },
  });
  return ok({ reports });
}