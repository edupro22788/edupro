import { requireApiGroupMember, ok, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;
  const groupId = user.membership!.groupId;

  const [group, subjects, files, assignments, announcements, schedule, messages, election, unread, isSup] =
    await Promise.all([
      prisma.group.findUnique({
        where: { id: groupId },
        include: {
          supervisor: { select: { id: true, firstName: true, lastName: true, gender: true } },
          studyLevel: {
            include: { major: { include: { faculty: { include: { university: { include: { state: true } } } } } } },
          },
          _count: { select: { memberships: true } },
        },
      }),
      prisma.subject.count({ where: { groupId, active: true } }),
      prisma.studyFile.count({ where: { groupId, status: 'PUBLISHED' } }),
      prisma.assignment.count({ where: { groupId, status: { not: 'DELETED' } } }),
      prisma.announcement.count({ where: { groupId, status: 'PUBLISHED' } }),
      prisma.weeklySchedule.count({ where: { groupId } }),
      prisma.chatMessage.count({ where: { groupId, status: 'ACTIVE' } }),
      prisma.election.findFirst({ where: { groupId, status: 'OPEN' } }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
      prisma.groupSupervisor.count({ where: { groupId, userId: user.id, endedAt: null } }),
    ]);

  if (!group) return ok({ error: 'group_not_found' });

  return ok({
    group: {
      id: group.id,
      name: group.name,
      members: group._count.memberships,
      supervisor: group.supervisor,
      path: {
        state: group.studyLevel.major.faculty.university.state.name,
        university: group.studyLevel.major.faculty.university.name,
        faculty: group.studyLevel.major.faculty.name,
        major: group.studyLevel.major.name,
        level: group.studyLevel.name,
      },
      subjectMarks: subjects,
      files: files,
      assignments,
      announcements,
      scheduleEntries: schedule,
      chatMessages: messages,
    },
    isSupervisor: Boolean(isSup) || group.supervisorId === user.id,
    openElection: election ? { id: election.id } : null,
    unread,
  });
}