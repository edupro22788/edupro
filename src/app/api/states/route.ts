import { ok } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const states = await prisma.state.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, name: true },
  });
  return ok({ states });
}