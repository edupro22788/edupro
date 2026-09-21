import type { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { saveUpload } from './storage';
import { MAX_FILE_SIZE_BYTES } from './constants';
import { moderateImage } from './image-moderation';
import type { UserModel } from '../../generated/prisma/models/User';

const CHAT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/** رفع صورة من الدردشة: تُحفظ ضمن ملفات الفوج (محمية) وترتبط برسالة */
export async function processChatUpload(req: NextRequest, user: UserModel, groupId: string) {
  const form = await req.formData().catch(() => null);
  if (!form) throw new ChatUploadError('طلب غير صالح');

  const file = form.get('file');
  if (!(file instanceof File)) throw new ChatUploadError('لم يتم إرسال صورة');
  if (!CHAT_IMAGE_TYPES.includes(file.type)) throw new ChatUploadError('يمكن رفع الصور فقط في الدردشة');
  if (file.size === 0) throw new ChatUploadError('الملف فارغ');
  if (file.size > MAX_FILE_SIZE_BYTES) throw new ChatUploadError('حجم الصورة كبير جدًا');

  const buffer = Buffer.from(await file.arrayBuffer());

  const verdict = await moderateImage(buffer);
  if (!verdict.ok) throw new ChatUploadError(verdict.reason);

  const saved = saveUpload(buffer, file.name, file.type, groupId);

  const studyFile = await prisma.studyFile.create({
    data: {
      title: file.name,
      description: '',
      category: 'FILE',
      groupId,
      uploaderId: user.id,
      fileName: saved.fileName,
      storedName: saved.storedName,
      storedPath: saved.storedPath,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      status: 'PUBLISHED',
    },
  });

  const message = await prisma.chatMessage.create({
    data: {
      content: file.name,
      groupId,
      senderId: user.id,
      messageType: 'FILE',
      fileRefId: studyFile.id,
    },
    include: { sender: { select: { id: true, firstName: true, lastName: true, gender: true } } },
  });

  return {
    id: message.id,
    content: message.content,
    type: message.messageType,
    createdAt: message.createdAt,
    sender: message.sender,
    file: {
      id: studyFile.id,
      title: studyFile.title,
      fileName: studyFile.fileName,
      mimeType: studyFile.mimeType,
      sizeBytes: studyFile.sizeBytes,
    },
    me: true,
    canDelete: true,
  };
}

export class ChatUploadError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ChatUploadError';
  }
}

/** يعيد رمز الحالة الصحيح */
export function chatUploadStatus(e: unknown): number {
  return e instanceof ChatUploadError ? 400 : 500;
}