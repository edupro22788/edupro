import { NextRequest } from 'next/server';
import {
  requireApiUser, ok, apiError, ApiGuardError, isApiSupervisor,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyGroup } from '@/lib/notifications';
import {
  ALLOWED_FILE_EXTS, FILE_EXT_LABEL, CONTENT_CATEGORIES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB,
} from '@/lib/constants';
import { saveUpload } from '@/lib/storage';
import { moderateImage, isImageMime } from '@/lib/image-moderation';

export async function GET(req: NextRequest) {
  let user = await requireApiUser().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const groupId = user.membership?.groupId ?? null;
  const sp = req.nextUrl.searchParams;
  const subjectId = sp.get('subjectId');
  const category = sp.get('category');
  const mine = sp.get('mine') === '1';
  const includePending = sp.get('pending') === '1';

  let where: Record<string, unknown> = groupId ? { groupId } : {};

  if (subjectId) {
    const subj = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subj) return apiError('المقياس غير موجود', 404);
    where = { subjectId: subj.id };
  }
  if (category && category in CONTENT_CATEGORIES) where.category = category;

  if (mine) {
    where.uploaderId = user.id;
    where.status = { in: ['PUBLISHED', 'PENDING', 'REJECTED'] };
  } else if (includePending && (isApiSupervisor(user) || user.role === 'ADMIN')) {
    where.status = { in: ['PUBLISHED', 'PENDING', 'REJECTED'] };
  } else {
    where.OR = [
      { status: 'PUBLISHED' },
      { uploaderId: user.id, status: { in: ['PENDING', 'REJECTED'] } },
    ];
  }

  const files = await prisma.studyFile.findMany({
    where: where as never,
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: { select: { id: true, firstName: true, lastName: true, gender: true } },
      subject: { select: { id: true, name: true } },
    },
    take: 200,
  });

  return ok({
    files: files.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      category: f.category,
      status: f.status,
      rejectReason: f.rejectReason,
      fileName: f.fileName,
      sizeBytes: f.sizeBytes,
      mimeType: f.mimeType,
      extLabel: FILE_EXT_LABEL[f.mimeType] || f.mimeType.split('/')[1]?.toUpperCase() || 'ملف',
      createdAt: f.createdAt,
      uploader: f.uploader,
      subject: f.subject,
      canManage: isApiSupervisor(user) || f.uploaderId === user.id || user.role === 'ADMIN',
    })),
  });
}

export async function POST(req: NextRequest) {
  let user = await requireApiUser().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const form = await req.formData().catch(() => null);
  if (!form) return apiError('طلب غير صالح');
  const file = form.get('file');
  if (!(file instanceof File)) return apiError('لم يتم إرسال ملف');

  if (file.size === 0) return apiError('الملف فارغ');
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return apiError(`حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE_MB} ميغابايت)`, 413);
  }
  if (!ALLOWED_FILE_EXTS.includes(file.type)) {
    return apiError('نوع الملف غير مسموح به', 415);
  }

  const title = String(form.get('title') || '').trim();
  if (!title || title.length > 120) return apiError('أدخل عنوانًا للملف');
  const description = String(form.get('description') || '').trim().slice(0, 500);
  const categoryRaw = String(form.get('category') || 'FILE');
  if (!(categoryRaw in CONTENT_CATEGORIES)) return apiError('تصنيف غير صالح');
  const subjectIdRaw = String(form.get('subjectId') || '');

  let subjectId: string | null = null;
  let groupId = user.membership?.groupId ?? null;
  if (subjectIdRaw) {
    const subj = await prisma.subject.findUnique({ where: { id: subjectIdRaw } });
    if (!subj) return apiError('المقياس غير محدد بشكل صحيح');
    subjectId = subj.id;
    groupId = subj.groupId;
  }
  if (!groupId) return apiError('يجب تحديد فوجك أولًا', 403);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isImageMime(file.type)) {
    const verdict = await moderateImage(buffer);
    if (!verdict.ok) return apiError(verdict.reason, 400);
  }
  const saved = saveUpload(buffer, file.name, file.type, groupId);

  const record = await prisma.studyFile.create({
    data: {
      title,
      description,
      category: categoryRaw as never,
      groupId,
      subjectId,
      uploaderId: user.id,
      fileName: saved.fileName,
      storedName: saved.storedName,
      storedPath: saved.storedPath,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      status: 'PENDING',
    },
  });

await notifyGroup({
      groupId,
      type: 'FILE_UPLOADED',
      title: 'ملف جديد 📄',
      body: `رفع ${user.firstName} ${user.lastName} الملف: ${title} — بانتظار المراجعة`,
      link: '/room/subjects',
      excludeUserId: user.id,
    });

  return ok({ file: { id: record.id, title: record.title, status: record.status } });
}