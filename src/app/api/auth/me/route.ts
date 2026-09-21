import { getApiUser, ok } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getApiUser();
  if (!user) return ok({ user: null });

  const unread = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return ok({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      gender: user.gender,
      emailVerified: Boolean(user.emailVerifiedAt),
      createdAt: user.createdAt,
    },
    group: user.membership
      ? {
          id: user.membership.groupId,
          name: user.membership.group.name,
          supervisorId: user.membership.group.supervisorId,
        }
      : null,
    unread,
  });
}