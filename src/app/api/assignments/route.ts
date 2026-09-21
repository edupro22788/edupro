import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError, isApiSupervisor } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyGroup } from '@/lib/notifications';
import { ALLOWED_FILE_EXTS, MAX_FILE_SIZE_BYTES } from '@/lib/constants';
import { saveUpload } from '@/lib/storage';
import { moderateImage, isImageMime } from '@/lib/image-moderation';

export async function GET() {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const assignments = await prisma.assignment.findMany({
    where: { groupId: user.membership!.groupId, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: { select: { id: true, firstName: true, lastName: true, gender: true } },
      subject: { select: { id: true, name: true } },
    },
    take: 200,
  });
  return ok({ assignments });
}

export async function POST(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;
  if (!isApiSupervisor(user)) return apiError('فقط مشرف الفوج يمكنه نشر الواجبات', 403);

  const form = await req.formData().catch(() => null);
  if (!form) return apiError('طلب غير صالح');

  const title = String(form.get('title') || '').trim();
  if (!title || title.length > 120) return apiError('أدخل عنوان الواجب');
  const description = String(form.get('description') || '').trim().slice(0, 1000);
  const subjectIdRaw = String(form.get('subjectId') || '');
  const dueDateRaw = String(form.get('dueDate') || '');

  let subjectId: string | null = null;
  if (subjectIdRaw) {
    const subj = await prisma.subject.findFirst({
      where: { id: subjectIdRaw, groupId: user.membership!.groupId },
    });
    if (!subj) return apiError('المقياس غير محدد بشكل صحيح');
    subjectId = subj.id;
  }

  let dueDate: Date | null = null;
  if (dueDateRaw) {
    const d = new Date(dueDateRaw);
    if (!Number.isNaN(d.getTime())) dueDate = d;
  }

  const groupId = user.membership!.groupId;
  let fileData: Awaited<ReturnType<typeof saveUpload>> | null = null;
  const file = form.get('file');
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_SIZE_BYTES) return apiError('حجم الملف مرفق كبير جدًا', 413);
    if (!ALLOWED_FILE_EXTS.includes(file.type)) return apiError('نوع الملف غير مسموح به', 415);
    const buffer = Buffer.from(await file.arrayBuffer());
    if (isImageMime(file.type)) {
      const verdict = await moderateImage(buffer);
      if (!verdict.ok) return apiError(verdict.reason, 400);
    }
    fileData = saveUpload(buffer, file.name, file.type, groupId);
  }

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      groupId,
      subjectId,
      uploaderId: user.id,
      dueDate,
      fileName: fileData?.fileName,
      storedName: fileData?.storedName,
      storedPath: fileData?.storedPath,
      mimeType: fileData?.mimeType,
      sizeBytes: fileData?.sizeBytes,
    },
  });

  await notifyGroup({
    groupId,
    type: 'ASSIGNMENT_ADDED',
    title: 'واجب جديد 📝',
    body: `نشر المشرف واجبًا: ${title}`,
    link: '/room/assignments',
    excludeUserId: user.id,
  });

  return ok({ assignment });
}