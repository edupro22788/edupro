'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Send, Paperclip, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/client';
import { Spinner, GenderDot, TimeAgo, ReportButton } from '@/components/ui';
import NextArrow from '@/components/NextArrow';

type Msg = {
  id: string; content: string; type: 'TEXT' | 'FILE'; createdAt: string;
  sender: { id: string; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE' | null };
  file: { id: string; title: string; fileName: string; mimeType: string; sizeBytes: number } | null;
  me: boolean; canDelete: boolean;
};

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const r = await apiGet<{ messages: Msg[] }>('/api/chat');
    if (r.ok) {
      setMsgs(r.data.messages);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = text.trim();
    if (!c || busy) return;
    setBusy(true);
    setText('');
    const r = await apiPost('/api/chat', { content: c });
    setBusy(false);
    if (r.ok) load();
    else setText(c);
  };

  const upload = async (f: File | null) => {
    if (!f) return;
    setBusy(true);
    const fd = new FormData();
    fd.set('file', f);
    const r = await apiPost('/api/chat', fd);
    setBusy(false);
    if (r.ok) load();
  };

  const del = async (m: Msg) => {
    if (!confirm('حذف هذه الرسالة؟')) return;
    await apiPatch(`/api/chat/${m.id}`, { action: 'delete' });
    load();
  };

  const report = async (m: Msg, reason: string) => {
    await apiPost(`/api/chat/${m.id}/report`, { reason });
    alert('تم إرسال البلاغ.');
  };

  const isImage = (mime?: string) => mime?.startsWith('image/');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="breadcrumb mb-1">
            <Link href="/room">غرفتي</Link><span className="sep">›</span><span className="current">الدردشة العامة</span>
          </div>
          <h1 className="text-xl font-black">الدردشة العامة</h1>
        </div>
        <span className="text-[11px] text-[var(--muted)]">تتحدث الآن بين أعضاء الفوج</span>
      </div>

      <div ref={scrollRef} className="card flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Spinner size={26} /></div>
        ) : msgs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--muted)]">
            <div className="text-5xl mb-3 opacity-40">💬</div>
            ابدأ أول محادثة في فوجك
          </div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.me ? 'justify-start flex-row-reverse' : ''}`}>
              <GenderDot gender={m.sender.gender} size={26} />
              <div className={`max-w-[75%] ${m.me ? 'items-end' : ''} flex flex-col`}>
                <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] mb-0.5" style={{ flexDirection: m.me ? 'row-reverse' : undefined }}>
                  <span className="font-bold">{m.me ? 'أنت' : `${m.sender.firstName} ${m.sender.lastName}`}</span>
                  <TimeAgo date={m.createdAt} />
                </div>
                <div
                  className={`chat-bubble ${m.me ? 'me' : ''} px-3.5 py-2 text-sm`}
                  style={
                    m.me
                      ? { background: 'linear-gradient(135deg,#e3c27c,#c9a962)', color: '#1a1408' }
                      : { background: 'rgba(15,12,5,.045)', border: '1px solid var(--line)' }
                  }
                >
                  {m.type === 'FILE' && m.file && isImage(m.file.mimeType) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/files/${m.file.id}/content`} alt={m.content} className="rounded-lg max-w-56" style={{ maxHeight: 180 }} />
                  )}
                  {m.type === 'FILE' && m.file && !isImage(m.file.mimeType) && (
                    <a href={`/api/files/${m.file.id}/download`} className="underline inline-flex items-center gap-2 font-bold">
                      <Paperclip size={13} /> {m.file.title || m.file.fileName}
                    </a>
                  )}
                  {m.content && <span className="whitespace-pre-wrap">{m.content}</span>}
                </div>
              </div>
              <div className="self-center flex items-center gap-1 opacity-0 group-hover:opacity-100">
                {m.canDelete && <button className="btn btn-ghost p-1.5" style={{ color: '#ff9b94' }} onClick={() => del(m)}><Trash2 size={13} /></button>}
                {!m.me && <ReportButton onReport={(reason) => report(m, reason)} />}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="mt-3 flex items-center gap-2">
        <label className="btn btn-ghost px-3 py-2.5 cursor-pointer" title="إرفاق صورة">
          <Paperclip size={18} />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0] || null)} />
        </label>
        <input
          className="input flex-1" placeholder="اكتب رسالتك…" value={text}
          onChange={(e) => setText(e.target.value)} disabled={busy}
        />
        <button className="btn btn-gold px-4 py-2.5" disabled={busy || !text.trim()}>
          <Send size={17} />
        </button>
      </form>

      <NextArrow href="/room/notifications" />
    </div>
  );
}