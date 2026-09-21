import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { getSession } from './session';

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      membership: {
        include: {
          group: {
            include: {
              studyLevel: {
                include: { major: { include: { faculty: { include: { university: { include: { state: true } } } } } } },
              },
            },
          },
        },
      },
    },
  });
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function userFullName(user: { firstName: string; lastName: string }) {
  return `${user.firstName} ${user.lastName}`;
}

// الحارس: لا يوجد مستخدم مسجل → تسجيل الدخول
export async function requireLogin() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

// الحارس: مستخدم أكّد بريده الإلكتروني
export async function requireVerified() {
  const user = await requireLogin();
  if (!user.emailVerifiedAt) redirect('/verify');
  return user;
}

// الحارس: مستخدم يملك فوجًا (أكمل البيانات الجامعية)
export async function requireGroup() {
  const user = await requireVerified();
  if (!user.membership) redirect('/onboarding');
  return user;
}

// الحارس: مدير النظام
export async function requireAdmin() {
  const user = await requireLogin();
  if (user.role !== 'ADMIN') redirect('/room');
  return user;
}

// هل المستخدم مشرف فوجه الحالي؟
export function isGroupSupervisor(user: CurrentUser): boolean {
  return Boolean(user.membership && user.membership.group.supervisorId === user.id);
}