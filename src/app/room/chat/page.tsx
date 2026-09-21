'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import Link from 'next/link';
import { Send, Paperclip, Trash2, Shield } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/client';
import { Spinner, GenderDot, TimeAgo, ReportButton, SupervisorBadge } from '@/components/ui';
import QuotePanel from '@/components/QuotePanel';

type Msg = {
  id: string; content: string; type: 'TEXT' | 'FILE'; createdAt: string;
  sender: { id: string; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE' | null };
  file: { id: string; title: string; fileName: string; mimeType: string; sizeBytes: number } | null;
  me: boolean; canDelete: boolean;
};

type ChatState = {
  banned: boolean;
  amSupervisor: boolean;
  supervisor: { id: string; firstName: string; lastName: string } | null;
  supervisorOffer: boolean;
  messages: Msg[];
};

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [banned, setBanned] = useState(false);
  const [amSupervisor, setAmSupervisor] = useState(false);
  const [supervisor, setSupervisor] = useState<{ id: string; firstName: string; lastName: string } | null>(null);
  const [supervisorOffer, setSupervisorOffer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [offerBusy, setOfferBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const r = await apiGet<ChatState>('/api/chat');
    if (r.ok) {
      setMsgs(r.data.messages);
      setBanned(r.data.banned);
      setAmSupervisor(r.data.amSupervisor);
      setSupervisor(r.data.supervisor);
      setSupervisorOffer(r.data.supervisorOffer);
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
    else alert(r.error);
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

  const respondOffer = async (action: 'accept' | 'decline') => {
    setOfferBusy(true);
    const r = await apiPost('/api/supervisor/offer', { action });
    setOfferBusy(false);
    if (r.ok) { setSupervisorOffer(false); load(); }
    else alert(r.error);
  };

  const isImage = (mime?: string) => mime?.startsWith('image/');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="breadcrumb mb-1">
            <Link href="/room">غرفتي</Link><span className="sep">›</span><span className="current">الدردشة العامة</span>
          </div>
          <h1 className="text-xl font-black inline-flex items-center gap-2">الدردشة العامة {amSupervisor && <SupervisorBadge />}</h1>
        </div>
        <span className="text-[11px] text-[var(--muted)]">
          {amSupervisor ? 'أنت مشرف هذا الفوج' : supervisor ? `المشرف: ${supervisor.firstName} ${supervisor.lastName}` : 'لا يوجد مشرف بعد'}
        </span>
      </div>

      {supervisorOffer && (
        <div className="card p-5 mb-4 fade-up" style={{ border: '1px solid rgba(201,169,98,.5)', background: 'linear-gradient(135deg, rgba(201,169,98,.12), rgba(201,169,98,.04))' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(201,169,98,.15)', color: 'var(--gold)' }}>
                <Shield size={24} />
              </div>
              <div>
                <h3 className="font-black">عرض: تولّي إشراف الفوج 🎉</h3>
                <p className="text-sm text-[var(--muted)] mt-0.5 leading-relaxed">
                  فوجك بدون مشرف حاليًا. أنت العضو الأول المؤهل — هل تريد أن تصبح مشرفًا على الفوج؟
                  <span className="block text-[11px] mt-1">كإشراف تستطيع: إدارة الجدول والمقاييس والواجبات، حظر الأعضاء من الشات، ونشر المواضيع المهمة.</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="btn btn-gold" disabled={offerBusy} onClick={() => respondOffer('accept')}>
                {offerBusy ? <Spinner /> : 'نعم، أوافق'}
              </button>
              <button className="btn btn-ghost" disabled={offerBusy} onClick={() => respondOffer('decline')}>لا، لاحقًا</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1 gap-4 flex-1 min-h-0">
      <div className="flex flex-col min-h-0">
      <div ref={scrollRef} className="card flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ borderColor: 'var(--gold)' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center"><Spinner size={26} /></div>
        ) : banned ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[var(--muted)]">
            <div className="text-5xl mb-3 opacity-40">🚫</div>
            <div className="font-bold text-[var(--fg)]">أنت محظور من الدردشة</div>
            <p className="text-sm mt-1">قرّر المشرف حظرك من المشاهدة والمشاركة. تواصل مع مشرف فوجك لرفع الحظر.</p>
          </div>
        ) : msgs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--muted)]">
            <div className="text-5xl mb-3 opacity-40">💬</div>
            ابدأ أول محادثة في فوجك
          </div>
        ) : (
          msgs.map((m, i) => (
            <Fragment key={m.id}>
            <div className={`flex gap-2 ${m.me ? 'justify-start flex-row-reverse' : ''}`}>
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
            {(i + 1) % 10 === 0 && (
              <div className="flex items-center justify-center gap-3 py-1 select-none" aria-label="تذكير بالصلاة على النبي">
                <span className="h-px flex-1" style={{ background: 'var(--line)' }} />
                <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#fff' }}>
                  ﷺ اللهم صلِّ وسلِّم على نبينا محمد
                </span>
                <span className="h-px flex-1" style={{ background: 'var(--line)' }} />
              </div>
            )}
            </Fragment>
          ))
        )}
      </div>

      {!banned && (
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
      )}
      </div>

      <QuotePanel />
      </div>
    </div>
  );
}