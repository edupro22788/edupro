'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/client';
import { Spinner, Empty } from '@/components/ui';
import { SUBJECT_ICONS } from '@/lib/constants';

type Subject = { id: string; name: string; icon: string; color: string; active: boolean; _count: { files: number } };

const ICON_LABEL: Record<string, string> = {
  academic: '🎓', brain: '🧠', stats: '📊', flask: '🧪', book: '📘', shield: '🛡️', scale: '⚖️', globe: '🌍', calculator: '🧮', microscope: '🔬',
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSup, setIsSup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('academic');
  const [color, setColor] = useState('#c9a962');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [room, r] = await Promise.all([
      apiGet<{ isSupervisor: boolean }>('/api/room'),
      apiGet<{ subjects: Subject[] }>('/api/subjects'),
    ]);
    if (room.ok) setIsSup(room.data.isSupervisor);
    if (r.ok) setSubjects(r.data.subjects);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const r = await apiPost('/api/subjects', { name, icon, color });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setShowForm(false); setName(''); setIcon('academic'); setColor('#c9a962');
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
            <Link key={s.id} href={`/room/subjects/${s.id}`} className="card p-4 fade-up block hover:opacity-90">
              <div className="rounded-2xl p-5 text-center" style={{ background: `linear-gradient(160deg, ${s.color}22, transparent 60%)`, border: `1px solid ${s.color}44` }}>
                <div className="text-4xl mb-2">{ICON_LABEL[s.icon]}</div>
                <div className="font-black line-clamp-1">{s.name}</div>
                <div className="text-xs text-[var(--muted)] mt-1">{s._count.files} ملف</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}