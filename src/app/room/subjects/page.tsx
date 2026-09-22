'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, X, Upload, Paperclip, Eye, Download, Check, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/client';
import { Spinner, Empty, FileTypeIcon, StatusPill, TimeAgo } from '@/components/ui';
import { SUBJECT_ICONS } from '@/lib/constants';

type Subject = { id: string; name: string; icon: string; color: string; active: boolean; _count: { files: number } };
type GroupFile = {
  id: string; title: string; category: string; status: string; rejectReason: string | null;
  fileName: string; sizeBytes: number; mimeType: string; extLabel: string; createdAt: string;
  uploader: { id: string; firstName: string; lastName: string };
  canManage: boolean;
};

const ICON_LABEL: Record<string, string> = {
  academic: '🎓', brain: '🧠', stats: '📊', flask: '🧪', book: '📘', shield: '🛡️', scale: '⚖️', globe: '🌍', calculator: '🧮', microscope: '🔬',
};

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gfiles, setGfiles] = useState<GroupFile[]>([]);
  const [isSup, setIsSup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('academic');
  const [color, setColor] = useState('#c9a962');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const room = await apiGet<{ isSupervisor: boolean }>('/api/room');
    if (room.ok) setIsSup(room.data.isSupervisor);
    const [r, gf] = await Promise.all([
      apiGet<{ subjects: Subject[] }>('/api/subjects'),
      apiGet<{ files: GroupFile[] }>('/api/files?unlinked=1'),
    ]);
    if (r.ok) setSubjects(r.data.subjects);
    if (gf.ok) setGfiles(gf.data.files);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const r = await apiPost('/api/subjects', { name, icon, color });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setShowForm(false); setName(''); setIcon('academic');
    load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    const r = await apiPatch(`/api/subjects/${id}`, { active: !active });
    if (r.ok) load();
  };

  const act = async (id: string, action: string, extra?: object) => {
    const r = await apiPatch(`/api/files/${id}/status`, { action, ...extra });
    if (r.ok) load();
  };

  const del = async (f: GroupFile) => {
    if (!confirm(`حذف «${f.title}»؟`)) return;
    await apiPatch(`/api/files/${f.id}`, { action: 'delete' });
    load();
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size={28} /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="breadcrumb mb-1"><Link href="/room">غرفتي</Link><span className="sep">›</span><span className="current">المقاييس</span></div>
          <h1 className="text-2xl font-black">المقاييس</h1>
          <p className="text-sm text-[var(--muted)]">دروس، ملخصات، مراجعات، محاضرات، تمارين وملفات لكل مقياس</p>
        </div>
        {isSup && (
          <button className="btn btn-gold" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X size={16} /> : <Plus size={16} />} مقياس جديد
          </button>
        )}
      </div>

      {isSup && showForm && (
        <form onSubmit={create} className="card p-5 mb-6 fade-up">
          <h3 className="font-bold mb-3">إضافة مقياس</h3>
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2">
              <input className="input" placeholder="اسم المقياس (مثال: علم النفس المرضي)" value={name} required onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-11 rounded-xl border border-[var(--line)] bg-transparent cursor-pointer" />
              <div className="flex gap-1 flex-wrap">
                {SUBJECT_ICONS.map((i) => (
                  <button type="button" key={i.key} className="btn btn-ghost p-1.5 text-lg" style={icon === i.key ? { borderColor: 'var(--gold)' } : {}} onClick={() => setIcon(i.key)} title={i.label}>
                    {ICON_LABEL[i.key]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <div className="text-sm mb-3 text-[#ff9b94]">{error}</div>}
          <button className="btn btn-gold" disabled={busy}>{busy ? <Spinner /> : 'إضافة'}</button>
        </form>
      )}

      {subjects.length === 0 ? (
        <Empty title="لا توجد مقاييس بعد" hint={isSup ? 'انقر «مقياس جديد» لإنشاء أول مقياس' : 'سيضيف مشرف الفوج المقاييس قريبًا'} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subjects.map((s) => (
            <div key={s.id} className={`card p-4 fade-up ${s.active ? '' : 'opacity-40'}`}>
              <Link href={`/room/subjects/${s.id}`} className="block">
                <div className="box3d">
                  <div className="rounded-2xl p-5 text-center" style={{ background: `linear-gradient(160deg, ${s.color}22, transparent 60%)`, border: `1px solid ${s.color}44` }}>
                    <div className="text-4xl mb-2">{ICON_LABEL[s.icon]}</div>
                    <div className="font-black line-clamp-1">{s.name}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">{s._count.files} ملف</div>
                  </div>
                </div>
              </Link>
              {isSup && (
                <div className="flex items-center gap-2 mt-2">
                  <button className="text-[11px] font-bold flex-1" style={{ color: s.active ? '#ff9b94' : 'var(--ok)' }} onClick={() => toggleActive(s.id, s.active)}>
                    {s.active ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button className="btn btn-ghost text-[11px] font-bold flex-1 justify-center" style={{ color: 'var(--gold)' }}
                  onClick={() => router.push(`/room/subjects/${s.id}?upload=1`)}>
                  <Upload size={13} className="inline-block ml-1" /> إضافة ملف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {gfiles.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-black flex items-center gap-2"><Paperclip size={18} /> ملفات الفوج العامة</h2>
            <span className="text-xs text-[var(--muted)]">ملفات رُفعت دون ربط بمقياس — تظهر هنا ليراها الجميع</span>
          </div>
          <div className="space-y-2">
            {gfiles.map((f) => (
              <div key={f.id} className="card p-3.5 flex items-center gap-3 fade-up">
                <FileTypeIcon mimeType={f.mimeType} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{f.title}</span>
                    <StatusPill status={f.status} />
                    {f.status === 'REJECTED' && f.rejectReason && (
                      <span className="text-[11px] text-[#ff9b94]">— {f.rejectReason}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--muted)]">
                    <span>{f.uploader.firstName} {f.uploader.lastName}</span>
                    <span>·</span><span>{f.extLabel}</span>
                    <span>·</span><TimeAgo date={f.createdAt} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {f.status === 'PUBLISHED' && (
                    <>
                      <a className="btn btn-ghost p-2" href={`/api/files/${f.id}/content`} target="_blank" title="عرض"><Eye size={16} /></a>
                      <a className="btn btn-ghost p-2" href={`/api/files/${f.id}/download`} title="تحميل"><Download size={16} /></a>
                    </>
                  )}
                  {(f.status === 'PENDING' || f.status === 'REJECTED') && f.canManage && (
                    <a className="btn btn-ghost p-2" href={`/api/files/${f.id}/content`} target="_blank" title="معاينة"><Eye size={16} /></a>
                  )}
                  {isSup && (f.status === 'PENDING' || f.status === 'REJECTED') && (
                    <>
                      <button className="btn btn-ghost p-2" style={{ color: 'var(--ok)' }} onClick={() => act(f.id, 'approve')} title="نشر"><Check size={16} /></button>
                      <button className="btn btn-ghost p-2" style={{ color: '#ff9b94' }} onClick={() => {
                        const reason = window.prompt('سبب الرفض:', 'محتوى غير مناسب');
                        if (reason !== null) act(f.id, 'reject', { reason });
                      }} title="رفض"><X size={16} /></button>
                    </>
                  )}
                  {f.canManage && <button className="btn btn-ghost p-2" style={{ color: '#ff9b94' }} onClick={() => del(f)} title="حذف"><Trash2 size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}