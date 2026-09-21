'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/lib/client';
import { Spinner, Empty } from '@/components/ui';
import { DAYS } from '@/lib/constants';
import NextArrow from '@/components/NextArrow';

type Entry = { id: string; day: number; startTime: string; endTime: string; subjectName: string; professorName: string | null; room: string | null };

export default function SchedulePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isSup, setIsSup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [f, setF] = useState({ day: 0, start: '08:00', end: '09:30', subject: '', prof: '', room: '' });

  const load = async () => {
    const [room, r] = await Promise.all([
      apiGet<{ isSupervisor: boolean }>('/api/room'),
      apiGet<{ entries: Entry[] }>('/api/schedule'),
    ]);
    if (room.ok) setIsSup(room.data.isSupervisor);
    if (r.ok) setEntries(r.data.entries);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const r = await apiPost('/api/schedule', {
      day: f.day, startTime: f.start, endTime: f.end, subjectName: f.subject,
      professorName: f.prof, room: f.room,
    });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setShow(false); setF({ day: 0, start: '08:00', end: '09:30', subject: '', prof: '', room: '' });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('حذف هذه الحصة؟')) return;
    await apiDelete(`/api/schedule/${id}`);
    load();
  };

  const todayIdx = (new Date().getDay() + 1) % 7;

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size={28} /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="breadcrumb mb-1">
            <Link href="/room">غرفتي</Link><span className="sep">›</span><span className="current">الجدول الأسبوعي</span>
          </div>
          <h1 className="text-2xl font-black">الجدول الأسبوعي</h1>
          <p className="text-sm text-[var(--muted)]">حصص الأساتذة خلال الأسبوع الجامعي (السبت → الجمعة)</p>
        </div>
        {isSup && (
          <button className="btn btn-gold" onClick={() => setShow((v) => !v)}><Plus size={16} /> حصة جديدة</button>
        )}
      </div>

      {show && (
        <form onSubmit={create} className="card p-5 mb-6 fade-up grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><label className="label">اليوم</label>
            <select className="input" value={f.day} onChange={(e) => setF({ ...f, day: Number(e.target.value) })}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div><label className="label">مقياس</label><input className="input" value={f.subject} required onChange={(e) => setF({ ...f, subject: e.target.value })} /></div>
          <div><label className="label">أستاذ</label><input className="input" value={f.prof} onChange={(e) => setF({ ...f, prof: e.target.value })} /></div>
          <div><label className="label">قاعة</label><input className="input" value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} /></div>
          <div><label className="label">من</label><input className="input" type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
          <div><label className="label">إلى</label><input className="input" type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
          {error && <div className="md:col-span-2 text-sm text-[#ff9b94] self-end">{error}</div>}
          <button className="btn btn-gold self-end" disabled={busy}>{busy ? <Spinner /> : 'أضف الحصة'}</button>
        </form>
      )}

      {entries.length === 0 ? (
        <Empty title="لا يوجد جدول بعد" hint="سيضيف مشرف الفوج الحصص الأسبوعية" />
      ) : (
        <div className="space-y-4">
          {DAYS.map((day, di) => {
            const list = entries.filter((e) => e.day === di);
            if (list.length === 0) return null;
            const isToday = di === todayIdx;
            return (
              <div key={day} className="card p-4" style={isToday ? { borderColor: 'rgba(201,169,98,.5)' } : undefined}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-black ${isToday ? '' : 'text-[var(--muted)]'}`} style={isToday ? { color: 'var(--gold)' } : undefined}>
                    {day} {isToday && '← اليوم'}
                  </span>
                </div>
                <div className="space-y-2">
                  {list.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,.03)' }}>
                      <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: 'rgba(201,169,98,.12)', color: 'var(--gold)' }}>
                        {e.startTime}–{e.endTime}
                      </span>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{e.subjectName}</div>
                        {(e.professorName || e.room) && (
                          <div className="text-[11px] text-[var(--muted)]">
                            {e.professorName && `أ. ${e.professorName}`}{e.room && ` · ${e.room}`}
                          </div>
                        )}
                      </div>
                      {isSup && <button className="btn btn-ghost p-1.5" style={{ color: '#ff9b94' }} onClick={() => del(e.id)}><Trash2 size={15} /></button>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NextArrow href="/room/announcements" />
    </div>
  );
}