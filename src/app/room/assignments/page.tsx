'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Download, Trash2, Paperclip, X } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/client';
import { Spinner, Empty, GenderDot, TimeAgo } from '@/components/ui';

type Assignment = {
  id: string; title: string; description: string; dueDate: string | null; fileName: string | null; sizeBytes: number | null; createdAt: string;
  uploader: { id: string; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE' | null };
  subject: { id: string; name: string } | null;
};

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [isSup, setIsSup] = useState(false);
  const [me, setMe] = useState('');
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [t, setT] = useState('');
  const [d, setD] = useState('');
  const [s, setS] = useState('');
  const [due, setDue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [room, r, meR] = await Promise.all([
      apiGet<{ isSupervisor: boolean }>('/api/room'),
      apiGet<{ assignments: Assignment[] }>('/api/assignments'),
      apiGet<{ user: { id: string } }>('/api/auth/me'),
    ]);
    if (room.ok) setIsSup(room.data.isSupervisor);
    if (r.ok) setItems(r.data.assignments);
    if (meR.ok) setMe(meR.data.user.id);
    const su = await apiGet<{ subjects: { id: string; name: string }[] }>('/api/subjects');
    if (su.ok) setSubjects(su.data.subjects);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const fd = new FormData();
    fd.set('title', t); fd.set('description', d);
    if (s) fd.set('subjectId', s);
    if (due) fd.set('dueDate', due);
    if (file) fd.set('file', file);
    const r = await apiPost('/api/assignments', fd);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setShow(false); setT(''); setD(''); setS(''); setDue(''); setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    load();
  };

  const del = async (a: Assignment) => {
    if (!confirm(`حذف الواجب «${a.title}»؟`)) return;
    await apiPatch(`/api/assignments/${a.id}`, { action: 'delete' });
    load();
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size={28} /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="breadcrumb mb-1">
            <Link href="/room">غرفتي</Link><span className="sep">›</span><span className="current">الواجبات</span>
          </div>
          <h1 className="text-2xl font-black">الواجبات</h1>
          <p className="text-sm text-[var(--muted)]">واجبات تُسجّلها وكل ما يتعلق بالدروس المقدّمة</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShow((v) => !v)}><Plus size={16} /> واجب جديد</button>
      </div>

      {show && (
        <form onSubmit={create} className="card p-5 mb-6 fade-up gap-3 grid grid-cols-1 md:grid-cols-2">
          <div><label className="label">العنوان</label><input className="input" value={t} required onChange={(e) => setT(e.target.value)} /></div>
          <div><label className="label">المقياس (اختياري)</label>
            <select className="input" value={s} onChange={(e) => setS(e.target.value)}>
              <option value="">بدون مقياس</option>
              {subjects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div><label className="label">تاريخ التسليم (اختياري)</label><input className="input" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          <div>
            <label className="label">مرفق (اختياري)</label>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(201,169,98,.10)', border: '1px solid rgba(201,169,98,.25)' }}>
                <Paperclip size={15} style={{ color: 'var(--gold)' }} />
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  className="btn btn-ghost p-1"
                  title="إزالة"
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-ghost w-full justify-center" onClick={() => fileRef.current?.click()}>
                <Paperclip size={15} /> إضافة صورة أو ملف
              </button>
            )}
          </div>
          <div className="md:col-span-2"><label className="label">الوصف</label><textarea className="input" rows={3} value={d} onChange={(e) => setD(e.target.value)} /></div>
          {error && <div className="md:col-span-2 text-sm text-[#ff9b94]">{error}</div>}
          <button className="btn btn-gold md:col-span-2" disabled={busy}>{busy ? <Spinner /> : 'نشر الواجب'}</button>
        </form>
      )}

      {items.length === 0 ? (
        <Empty title="لا توجد واجبات بعد" hint="أضف أول واجب ليتابع الفوج" />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-bold flex items-center gap-2">
                    {a.subject && <span className="text-[11px] rounded-md px-2 py-0.5" style={{ background: 'rgba(201,169,98,.12)', color: 'var(--gold)' }}>{a.subject.name}</span>}
                    {a.title}
                  </div>
                  {a.description && <p className="text-sm text-[var(--muted)] mt-1 whitespace-pre-wrap">{a.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1"><GenderDot gender={a.uploader.gender} size={15} />{a.uploader.firstName} {a.uploader.lastName}</span>
                    {a.dueDate && <span className="inline-flex items-center gap-1"><Calendar size={12} /> حتى {fmtDate(a.dueDate)}</span>}
                    {a.fileName && <span><Download size={11} /> {a.fileName}</span>}
                    <span>·</span><TimeAgo date={a.createdAt} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {a.fileName && <a className="btn btn-ghost p-2" href={`/api/assignments/${a.id}/file`} title="تحميل"><Download size={16} /></a>}
                  {(a.uploader.id === me || isSup) && (
                    <button className="btn btn-ghost p-2" style={{ color: '#ff9b94' }} onClick={() => del(a)} title="حذف"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString('ar-DZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}