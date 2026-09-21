'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pin, Plus, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/client';
import { Spinner, Empty, GenderDot, TimeAgo, ReportButton } from '@/components/ui';
import { ANNOUNCEMENT_TYPES } from '@/lib/constants';
import NextArrow from '@/components/NextArrow';

type Ann = {
  id: string; title: string; content: string; type: string; pinned: boolean; createdAt: string;
  author: { id: string; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE' | null };
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Ann[]>([]);
  const [isSup, setIsSup] = useState(false);
  const [me, setMe] = useState('');
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [t, setT] = useState('');
  const [c, setC] = useState('');
  const [ty, setTy] = useState('IMPORTANT');

  const load = async () => {
    const [room, r, meR] = await Promise.all([
      apiGet<{ isSupervisor: boolean }>('/api/room'),
      apiGet<{ announcements: Ann[] }>('/api/announcements'),
      apiGet<{ user: { id: string } }>('/api/auth/me'),
    ]);
    if (room.ok) setIsSup(room.data.isSupervisor);
    if (r.ok) setItems(r.data.announcements);
    if (meR.ok) setMe(meR.data.user.id);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const r = await apiPost('/api/announcements', { title: t, content: c, type: ty });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setShow(false); setT(''); setC(''); setTy('IMPORTANT');
    load();
  };

  const act = async (a: Ann, action: string) => {
    const r = await apiPatch(`/api/announcements/${a.id}`, { action });
    if (r.ok) load();
  };

  const report = async (a: Ann, reason: string) => {
    await apiPost(`/api/announcements/${a.id}/report`, { reason });
    alert('تم إرسال البلاغ.');
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size={28} /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="breadcrumb mb-1">
            <Link href="/room">غرفتي</Link><span className="sep">›</span><span className="current">المواضيع المهمة</span>
          </div>
          <h1 className="text-2xl font-black">المواضيع المهمة</h1>
          <p className="text-sm text-[var(--muted)]">إعلانات تغيير الحصص، الغيابات، التأجيلات والأمور الهامة لفوجك</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShow((v) => !v)}><Plus size={16} /> إعلان</button>
      </div>

      {show && (
        <form onSubmit={create} className="card p-5 mb-6 fade-up">
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <input className="input" placeholder="عنوان الإعلان" value={t} required onChange={(e) => setT(e.target.value)} />
            <select className="input" value={ty} onChange={(e) => setTy(e.target.value)}>
              {Object.entries(ANNOUNCEMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <textarea className="input mb-3" rows={3} placeholder="تفاصيل الإعلان…" value={c} required onChange={(e) => setC(e.target.value)} />
          {error && <div className="text-sm mb-3 text-[#ff9b94]">{error}</div>}
          <button className="btn btn-gold" disabled={busy}>{busy ? <Spinner /> : 'نشر'}</button>
        </form>
      )}

      {items.length === 0 ? (
        <Empty title="لا توجد إعلانات" hint="أضف أول موضوع مهم للفوج" />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="card p-4" style={a.pinned ? { borderColor: 'rgba(201,169,98,.45)' } : undefined}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.pinned && <Pin size={14} style={{ color: 'var(--gold)' }} />}
                    <span className="font-black text-[15px]">{a.title}</span>
                    <span className="text-[10px] rounded-md px-1.5 py-0.5" style={{ background: 'rgba(201,169,98,.1)', color: 'var(--gold)' }}>
                      {ANNOUNCEMENT_TYPES[a.type as keyof typeof ANNOUNCEMENT_TYPES] || a.type}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap mt-1.5 text-[var(--muted)]" style={{ color: 'var(--text)' }}>{a.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1"><GenderDot gender={a.author.gender} size={15} />{a.author.firstName} {a.author.lastName}</span>
                    <span>·</span><TimeAgo date={a.createdAt} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isSup && (
                    <button className="btn btn-ghost p-2" style={{ color: a.pinned ? '#ff9b94' : 'var(--gold)' }}
                      onClick={() => act(a, 'togglePin')} title={a.pinned ? 'إلغاء التثبيت' : 'تثبيت'}>
                      <Pin size={16} />
                    </button>
                  )}
                  {(a.author.id === me || isSup) && (
                    <button className="btn btn-ghost p-2" style={{ color: '#ff9b94' }} onClick={() => act(a, 'delete')} title="حذف"><Trash2 size={16} /></button>
                  )}
                  {a.author.id !== me && <ReportButton onReport={(reason) => report(a, reason)} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NextArrow href="/room/chat" />
    </div>
  );
}