import { prisma } from './prisma';
import type { NotificationType } from '../../generated/prisma/enums';

type NotifyInput = {
  groupId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  excludeUserId?: string;
  userIds?: string[];
};

export async function notifyGroup({ groupId, type, title, body, link, excludeUserId, userIds }: NotifyInput) {
  const members = await prisma.membership.findMany({
    where: {
      groupId,
      userId: userIds ? { in: userIds } : excludeUserId ? { not: excludeUserId } : undefined,
    },
    select: { userId: true },
  });

  if (!members.length) return;

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      groupId,
      type,
      title,
      body,
      link: link || null,
    })),
  });
}

export async function notifyUser(userId: string, data: Omit<NotifyInput, 'groupId' | 'userIds' | 'excludeUserId'>) {
  await prisma.notification.create({
    data: {
      userId,
      ...data,
    },
  });
}