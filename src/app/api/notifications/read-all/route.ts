import { requireApiGroupMember, ok, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function POST() {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  return ok();
}