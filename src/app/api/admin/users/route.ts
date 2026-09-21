import { NextRequest } from 'next/server';
import { requireApiAdmin, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  let admin = await requireApiAdmin().catch((e: unknown) => e as ApiGuardError);
  if (admin instanceof ApiGuardError) return admin.response;

  const sp = req.nextUrl.searchParams;
  const q = sp.get('q')?.trim() || '';
  const role = sp.get('role') || '';

  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }] }
        : {}),
      ...(role === 'ADMIN' ? { role: 'ADMIN' } : role === 'STUDENT' ? { role: 'STUDENT' } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      gender: true,
      emailVerifiedAt: true,
      createdAt: true,
      membership: { select: { group: { select: { id: true, name: true } } } },
    },
  });

  return ok({ users });
}