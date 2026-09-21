'use client';

import Link from 'next/link';
import {
  MessagesSquare, CalendarDays, Pin, Menu, Shield, Users,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch } from '@/lib/client';
import { Spinner, GenderDot, SupervisorBadge, TimeAgo } from '@/components/ui';
import { ANNOUNCEMENT_TYPES, DAYS } from '@/lib/constants';

type RoomData = {
  group: {
    id: string; name: string; members: number;
    supervisor: { id: string; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE' | null } | null;
    path: { state: string; university: string; faculty: string; major: string; level: string };
    subjectMarks: number; files: number; assignments: number; announcements: number; scheduleEntries: number; chatMessages: number;
  };
  isSupervisor: boolean;
  openElection: { id: string } | null;
  unread: number;
};

type Ann = {
  id: string; title: string; content: string; type: string; pinned: boolean; createdAt: string;
  author: { firstName: string; lastName: string; gender: 'MALE' | 'FEMALE' | null };
};

type ScheduleEntry = { id: string; day: number; startTime: string; endTime: string; subjectName: string; professorName: string | null; room: string | null };

export default function RoomPage() {
  const router = useRouter();
  const [data, setData] = useState<RoomData | null>(null);
  const [anns, setAnns] = useState<Ann[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [pinForm, setPinForm] = useState(false);
  const [pin, setPin] = useState({ title: '', content: '', type: 'IMPORTANT' });
  const [notice, setNotice] = useState('');

  const load = async () => {
    const room = await apiGet<RoomData>('/api/room');
    if (!room.ok) {
      if (room.status === 401) router.replace('/login');
      else if (room.status === 403 && room.error.includes('تأكيد')) router.replace('/verify');
      else if (room.status === 403) router.replace('/onboarding');
      return;
    }
    setData(room.data);
    const an = await apiGet<{ announcements: Ann[] }>('/api/announcements');
    if (an.ok) setAnns(an.data.announcements.slice(0, 5));
    const sc = await apiGet<{ entries: ScheduleEntry[] }>('/api/schedule');
    if (sc.ok) setSchedule(sc.data.entries);
    const su = await apiGet<{ subjects: { id: string; name: string }[] }>('/api/subjects');
    if (su.ok) setSubjects(su.data.subjects);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('pin');
    const r = await apiPost('/api/announcements', pin);
    setBusyId('');
    if (r.ok) { setPinForm(false); setPin({ title: '', content: '', type: 'IMPORTANT' }); setNotice('تم النشر بنجاح'); load(); }
  };

  const togglePin = async (id: string) => {
    const r = await apiPatch(`/api/announcements/${id}`, { action: 'togglePin' });
    if (r.ok) load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={28} /></div>;

  // اليوم الحالي: السبت=0 ... (الجمعة=6)
  const todayIdx = (new Date().getDay() + 1) % 7;
  const todayEntries = schedule.filter((s) => s.day === todayIdx);
  const todayLabel = DAYS[todayIdx];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {notice && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: 'rgba(63,191,127,.12)', color: 'var(--ok)' }}>{notice}</div>
      )}

      {/* بطاقة الفوج */}
      <div className="card relative overflow-hidden p-6 mb-6 fade-up">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(600px 200px at 80% 0%, rgba(201,169,98,.15), transparent 60%)' }} />
        <div className="relative">
          <div className="breadcrumb mb-3">
            <span>{data!.group.path.state}</span><span className="sep">›</span>
            <span>{data!.group.path.university}</span><span className="sep">›</span>
            <span>{data!.group.path.faculty}</span><span className="sep">›</span>
            <span>{data!.group.path.major}</span><span className="sep">›</span>
            <span>{data!.group.path.level}</span><span className="sep">›</span>
            <span className="current">{data!.group.name}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Menu size={22} style={{ color: 'var(--gold)' }} />
              <div>
                <h1 className="text-2xl md:text-3xl font-black">{data!.group.name}</h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1"><Users size={14} /> {data!.group.members} عضو</span>
                  {(data!.group.supervisor || data!.isSupervisor) && (
                    <span className="inline-flex items-center gap-1.5">
                      <GenderDot gender={data!.group.supervisor?.gender ?? null} size={20} />
                      <span>المشرف: {data!.isSupervisor ? 'أنت' : `${data!.group.supervisor?.firstName} ${data!.group.supervisor?.lastName}`}</span>
                      <SupervisorBadge />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {data!.isSupervisor && (
              <button className="btn btn-gold text-sm" onClick={() => setPinForm((v) => !v)}>
                <Pin size={15} /> إعلان مهم
              </button>
            )}
          </div>
        </div>
      </div>

      {/* نموذج إعلان مهم */}
      {pinForm && (
        <form onSubmit={submitPin} className="card p-5 mb-6 fade-up">
          <h3 className="font-bold mb-3">نشر إعلان مهم</h3>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <input className="input" placeholder="عنوان الإعلان" value={pin.title} required onChange={(e) => setPin({ ...pin, title: e.target.value })} />
            <select className="input" value={pin.type} onChange={(e) => setPin({ ...pin, type: e.target.value })}>
              {Object.entries(ANNOUNCEMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <textarea className="input mb-3" rows={3} placeholder="نص الإعلان…" value={pin.content} required onChange={(e) => setPin({ ...pin, content: e.target.value })} />
          <button className="btn btn-gold" disabled={busyId === 'pin'}>{busyId === 'pin' ? <Spinner /> : 'نشر'}</button>
        </form>
      )}

      {/* حصص اليوم وأهم الأخبار */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* أهم الأخبار */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg inline-flex items-center gap-2"><Pin size={16} style={{ color: 'var(--gold)' }} /> المواضيع المهمة</h3>
            <Link href="/room/announcements" className="text-xs font-bold" style={{ color: 'var(--gold)' }}>الكل ←</Link>
          </div>
          <div className="space-y-3">
            {anns.length === 0 && <div className="text-sm text-[var(--muted)]">لا توجد مواضيع مهمة بعد.</div>}
            {anns.map((a) => (
              <div key={a.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-sm flex items-center gap-2">
                    {a.pinned && <Pin size={12} style={{ color: 'var(--gold)' }} />}
                    <span>{a.title}</span>
                  </div>
                  <span className="text-[10px] text-[var(--muted)]"><TimeAgo date={a.createdAt} /></span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{a.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                    <GenderDot gender={a.author.gender} size={16} />
                    {a.author.firstName} {a.author.lastName}
                  </span>
                  {data!.isSupervisor && (
                    <button className="text-[11px] font-bold" style={{ color: a.pinned ? '#ff9b94' : 'var(--gold)' }} onClick={() => togglePin(a.id)}>
                      {a.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* حصص اليوم */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg inline-flex items-center gap-2"><CalendarDays size={16} style={{ color: 'var(--pink)' }} /> حصص اليوم — {todayLabel}</h3>
            <Link href="/room/schedule" className="text-xs font-bold" style={{ color: 'var(--gold)' }}>الجدول ←</Link>
          </div>
          <div className="space-y-3">
            {todayEntries.length === 0 && <div className="text-sm text-[var(--muted)]">لا حصص اليوم. استرح أو راجع دروسك 😊</div>}
            {todayEntries.map((e) => (
              <div key={e.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)' }}>
                <span className="rounded-lg px-2.5 py-1 text-xs font-black" style={{ background: 'rgba(201,169,98,.12)', color: 'var(--gold)' }}>
                  {e.startTime}–{e.endTime}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-sm">{e.subjectName}</div>
                  {e.professorName && <div className="text-[11px] text-[var(--muted)]">أ. {e.professorName}</div>}
                </div>
                {e.room && <span className="text-[11px] font-bold text-[var(--gold)]">{e.room}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* المشرف والانتخابات */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="card p-4 flex items-center gap-3">
          <Shield size={26} style={{ color: 'var(--gold)' }} />
          <div>
            <div className="text-xs text-[var(--muted)]">مشرف الفوج</div>
            {data!.isSupervisor
              ? <div className="font-bold"><SupervisorBadge /></div>
              : data!.group.supervisor
                ? <div className="font-bold text-sm">{data!.group.supervisor.firstName} {data!.group.supervisor.lastName}</div>
                : <div className="text-sm">لا يوجد مشرف بعد</div>}
          </div>
        </div>

        <Link href="/room/chat" className="card p-4 flex items-center gap-3 hover:border-[rgba(201,169,98,.4)]">
          <MessagesSquare size={26} style={{ color: 'var(--ok)' }} />
          <div>
            <div className="text-xs text-[var(--muted)]">دردشة الفوج</div>
            <div className="font-bold text-sm">{data!.group.chatMessages} رسالة</div>
          </div>
        </Link>

        <div className="card p-4 flex items-center gap-3">
          <Users size={26} style={{ color: 'var(--purple)' }} />
          <div>
            <div className="text-xs text-[var(--muted)]">أعضاء الفوج</div>
            <div className="font-bold text-sm">{data!.group.members} طالب</div>
          </div>
        </div>
      </div>
    </div>
  );
}