import { NextRequest } from 'next/server';
import {
  requireApiGroupMember, ok, apiError, ApiGuardError,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { processChatUpload, ChatUploadError, chatUploadStatus } from '@/lib/chat-files';
import { containsOffensive } from '@/lib/moderation';
import { getSupervisorOfferCtx } from '@/lib/supervisor';

export async function GET(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const groupId = user.membership!.groupId;
  const banned = Boolean(user.membership!.chatBannedAt);
  const supervisorCtx = await getSupervisorOfferCtx(user);

  const beforeRaw = req.nextUrl.searchParams.get('before');
  const before = beforeRaw && !Number.isNaN(Date.parse(beforeRaw)) ? new Date(beforeRaw) : undefined;

  const messages = banned
    ? []
    : await prisma.chatMessage.findMany({
        where: { groupId, status: 'ACTIVE', ...(before ? { createdAt: { lt: before } } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 60,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, gender: true } },
          fileRef: {
            select: { id: true, title: true, fileName: true, mimeType: true, sizeBytes: true, status: true },
          },
        },
      });

  return ok({
    banned,
    amSupervisor: supervisorCtx.amSupervisor,
    supervisor: supervisorCtx.supervisor,
    supervisorOffer: supervisorCtx.offer,
    messages: messages
      .reverse()
      .map((m) => ({
        id: m.id,
        content: m.content,
        type: m.messageType,
        createdAt: m.createdAt,
        sender: m.sender,
        file: m.messageType === 'FILE' && m.fileRef
          ? {
              id: m.fileRef.id,
              title: m.fileRef.title,
              fileName: m.fileRef.fileName,
              mimeType: m.fileRef.mimeType,
              sizeBytes: m.fileRef.sizeBytes,
            }
          : null,
        me: m.senderId === user.id,
        canDelete: m.senderId === user.id || supervisorCtx.amSupervisor,
      })),
  });
}

export async function POST(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  if (user.membership!.chatBannedAt) {
    return apiError('أنت محظور من الدردشة من قبل المشرف', 403);
  }

  const contentType = req.headers.get('content-type') || '';
  const groupId = user.membership!.groupId;

  if (contentType.includes('multipart/form-data')) {
    try {
      const file = await processChatUpload(req, user, groupId);
      return ok({ message: file });
    } catch (error) {
      if (error instanceof ChatUploadError) return apiError(error.message, chatUploadStatus(error));
      console.error('chat upload failed', error);
      return apiError('تعذّر رفع الصورة، حاول مجددًا', 500);
    }
  }

  const body = await req.json().catch(() => ({}));
  const content = String(body?.content || '').trim();
  if (!content) return apiError('الرسالة فارغة');
  if (content.length > 2000) return apiError('الرسالة طويلة جدًا');
  if (containsOffensive(content)) return apiError('الرسالة تحتوي كلمات غير لائقة — تم منعها');

  const message = await prisma.chatMessage.create({
    data: { content, groupId, senderId: user.id, messageType: 'TEXT' },
    include: { sender: { select: { id: true, firstName: true, lastName: true, gender: true } } },
  });

  return ok({
    message: {
      id: message.id,
      content: message.content,
      type: 'TEXT',
      createdAt: message.createdAt,
      sender: message.sender,
      file: null,
      me: true,
      canDelete: true,
    },
  });
}