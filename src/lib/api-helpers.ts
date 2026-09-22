import { NextResponse } from 'next/server';
import { prisma } from './prisma';
import { getSession } from './session';

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

export async function getApiUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      membership: { include: { group: true } },
    },
  });
  return user;
}

export type ApiUser = NonNullable<Awaited<ReturnType<typeof getApiUser>>>;

export async function requireApiUser() {
  const user = await getApiUser();
  if (!user) {
    const r = apiError('يجب تسجيل الدخول', 401);
    throw new ApiGuardError(r);
  }
  return user as ApiUser;
}

/** يتطلب مستخدمًا كاملًا (مؤكد البريد + عضو في فوج) */
export async function requireApiGroupMember() {
  const user = await getApiUser();
  if (!user) {
    const r = apiError('يجب تسجيل الدخول', 401);
    throw new ApiGuardError(r);
  }
  if (!user.emailVerifiedAt) {
    const r = apiError('يجب تأكيد بريدك الإلكتروني أولًا', 403, 'EMAIL_NOT_VERIFIED');
    throw new ApiGuardError(r);
  }
  if (!user.membership) {
    const r = apiError('يجب تحديد فوجك أولًا', 403, 'NO_GROUP');
    throw new ApiGuardError(r);
  }
  return user as Omit<ApiUser, 'membership'> & {
    membership: NonNullable<ApiUser['membership']>;
  };
}

export async function requireApiAdmin() {
  const user = await requireApiUser();
  if (user.role !== 'ADMIN') {
    const r = apiError('غير مصرح لك', 403);
    throw new ApiGuardError(r);
  }
  return user;
}

/** هل المستخدم مشرف فوجه؟ */
export function isApiSupervisor(user: ApiUser): boolean {
  return Boolean(user.membership && user.membership.group.supervisorId === user.id);
}

/** هل يمكن للمستخدم الوصول إلى مقياس معيّن (فوجه، أو منشئه، أو أدمن المنصة)؟ */
export function canAccessSubject(
  user: ApiUser,
  subject: { groupId: string; createdById: string | null },
): boolean {
  if (user.role === 'ADMIN') return true;
  if (subject.createdById && subject.createdById === user.id) return true;
  if (user.membership && subject.groupId === user.membership.groupId) return true;
  return false;
}

export class ApiGuardError extends Error {
  response: NextResponse;
  constructor(response: NextResponse) {
    super('ApiGuardError');
    this.response = response;
  }
}

/** تعامل مع ApiGuardError داخل المعالج */
export function handleGuard(e: unknown): NextResponse {
  if (e instanceof ApiGuardError) return e.response;
  console.error(e);
  return apiError('خطأ داخلي في الخادم', 500);
}

export function ok(data: unknown = { ok: true }) {
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}