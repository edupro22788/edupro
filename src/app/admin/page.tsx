'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Network, Users, Flag, Plus, ChevronLeft, ShieldCheck, Shield,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import { apiGet, apiPost, apiPatch } from '@/lib/client';
import { Spinner, Empty, TimeAgo } from '@/components/ui';
import { REPORT_REASONS } from '@/lib/constants';

type Summary = {
  counts: {
    users: number; states: number; universities: number; faculties: number; majors: number;
    levels: number; groups: number; files: number; pendingFiles: number; reports: number; elections: number;
  };
};

type AdminUser = {
  id: string; firstName: string; lastName: string; email: string; role: string;
  gender: 'MALE' | 'FEMALE' | null; emailVerifiedAt: string | null; createdAt: string;
  membership: { group: { id: string; name: string } } | null;
};

type Report = {
  id: string; type: string; reason: string; content: string | null; createdAt: string;
  reporter: { firstName: string; lastName: string };
  group: { id: string; name: string };
};

const TYPE_LABEL: Record<string, string> = {
  CHAT_MESSAGE: 'رسالة', FILE: 'ملف', ANNOUNCEMENT: 'إعلان', ASSIGNMENT: 'واجب', USER: 'مستخدم',
};

type Level = 'states' | 'universities' | 'faculties' | 'majors' | 'levels' | 'groups';
type Node = { id: string; name: string; _count?: Record<string, number>; order?: number };

export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'structure' | 'users' | 'reports'>('overview');
  const [summary, setSummary] = useState<Summary['counts'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);

  // البنية
  const [level, setLevel] = useState<Level>('states');
  const [stack, setStack] = useState<Node[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [addName, setAddName] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addErr, setAddErr] = useState('');

  // المستخدمون
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userQ, setUserQ] = useState('');

  // البلاغات
  const [reports, setReports] = useState<Report[]>([]);

  const loadSummary = async () => {
    const r = await apiGet<Summary>('/api/admin/summary');
    if (!r.ok) { if (r.status === 403) setNotAdmin(true); return; }
    setSummary(r.data.counts);
  };

  const loadLevel = async (l: Level) => {
    const parent = stack[stack.length - 1];
    const q = new URLSearchParams({ kind: l });
    if (parent) {
      const paramMap: Record<string, string> = {
        states: '', universities: 'stateId', faculties: 'universityId',
        majors: 'facultyId', levels: 'majorId', groups: 'levelId',
      };
      const prop = paramMap[l];
      if (prop) q.set(prop, parent.id);
    }
    const r = await apiGet<{ [k: string]: Node[] }>(`/api/admin/hierarchy?${q}`);
    if (r.ok) setNodes(r.data[l] || []);
  };

  useEffect(() => {
    (async () => {
      await loadSummary();
      await loadLevel('states');
      const u = await apiGet<{ users: AdminUser[] }>('/api/admin/users');
      if (u.ok) setUsers(u.data.users);
      const rp = await apiGet<{ reports: Report[] }>('/api/admin/reports');
      if (rp.ok) setReports(rp.data.reports);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { loadLevel(level); }, [level]);

  const Nav = (n: Node) => {
    const clean = n.name;
    if (!clean) return;
    setStack((s) => [...s, n]);
    const nextMap: Record<Level, Level> = {
      states: 'universities', universities: 'faculties', faculties: 'majors',
      majors: 'levels', levels: 'groups', groups: 'groups',
    };
    setLevel(nextMap[level]);
  };

  const addNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddBusy(true); setAddErr('');
    const body: Record<string, unknown> = { kind: { states: 'state', universities: 'university', faculties: 'faculty', majors: 'major', levels: 'level', groups: 'group' }[level], name: addName };
    const parent = stack[stack.length - 1];
    if (parent) body[{ states: '', universities: 'stateId', faculties: 'universityId', majors: 'facultyId', levels: 'majorId', groups: 'levelId' }[level]] = parent.id;
    const r = await apiPost('/api/admin/hierarchy', body);
    setAddBusy(false);
    if (!r.ok) { setAddErr(r.error); return; }
    setAddName('');
    loadLevel(level);
  };

  const userAct = async (id: string, action: string) => {
    const r = await apiPatch(`/api/admin/users/${id}`, { action });
    if (r.ok) {
      const u = await apiGet<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(userQ)}`);
      if (u.ok) setUsers(u.data.users);
    }
  };

  const reportAct = async (id: string, action: string) => {
    const r = await apiPatch(`/api/admin/reports/${id}`, { action });
    if (r.ok) {
      const rp = await apiGet<{ reports: Report[] }>('/api/admin/reports');
      if (rp.ok) setReports(rp.data.reports);
      loadSummary();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={28} /></div>;

  if (notAdmin) {
    return (
      <>
        <TopNav />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="text-5xl mb-4 opacity-50"><Shield size={60} /></div>
          <h1 className="text-xl font-black mb-2">غير مصرح</h1>
          <p className="text-sm text-[var(--muted)]">هذه الصفحة مخصصة لمدير النظام فقط</p>
          <Link href="/room" className="btn btn-gold mt-5 w-full">العودة إلى غرفتي</Link>
        </div>
      </>
    );
  }

  const LevelName = { states: 'الولايات', universities: 'الجامعات', faculties: 'الكليات', majors: 'التخصصات', levels: 'المستويات', groups: 'الأفواج' };

  const countCols: [string, string, string][] = [
    ['states', 'ولاية', '🏛️'], ['universities', 'جامعة', '🏫'], ['faculties', 'كلية', '📚'],
    ['majors', 'تخصص', '🎓'], ['levels', 'مستوى', '📈'], ['groups', 'فوج', '👥'],
  ];

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-black inline-flex items-center gap-2">
            <LayoutDashboard size={20} style={{ color: 'var(--gold)' }} /> لوحة إدارة النظام
          </h1>
        </div>

        {/* تبويبات */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            ['overview', 'نظرة عامة', layoutDashboard],
            ['structure', 'البنية الجامعية', network],
            ['users', 'المستخدمون', usersIcon],
            ['reports', `البلاغات${reports.length ? ` (${reports.length})` : ''}`, flagIcon],
          ] as const).map(([k, label, Icon]) => (
            <button key={k} className={`btn text-sm ${tab === k ? 'btn-gold' : ''}`} onClick={() => setTab(k as typeof tab)}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* نظرة عامة */}
        {tab === 'overview' && summary && (
          <div className="fade-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                ['users', 'مستخدم', '👤'], ['groups', 'فوج', '👥'], ['files', 'ملف', '📄'],
                ['elections', 'انتخابات مفتوحة', '🗳️'],
              ].map(([k, label, icon]) => (
                <div key={k} className="card p-5 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-3xl font-black" style={{ color: 'var(--gold)' }}>{summary[k as keyof Summary['counts']] as number}</div>
                  <div className="text-xs text-[var(--muted)]">{label}</div>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <div className="font-bold mb-3">الهيكل الجامعي</div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {countCols.map(([k, label, icon]) => (
                  <div key={k} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)' }}>
                    <div className="text-lg">{icon}</div>
                    <div className="text-xl font-black">{summary[k as keyof Summary['counts']] as number}</div>
                    <div className="text-[10px] text-[var(--muted)]">{label}</div>
                  </div>
                ))}
              </div>
              {summary.pendingFiles > 0 && (
                <div className="mt-4 text-sm rounded-xl p-3" style={{ background: 'rgba(201,169,98,.1)', color: 'var(--gold)' }}>
                  ⏳ {summary.pendingFiles} ملف قيد المراجعة في الأفواج
                </div>
              )}
            </div>
          </div>
        )}

        {/* البنية */}
        {tab === 'structure' && (
          <div className="card p-5 fade-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 text-sm flex-wrap">
                {[
                  ['states', '', 'البداية'],
                  ...stack.map((n, i) => [i === 0 ? 'universities' : i === 1 ? 'faculties' : i === 2 ? 'majors' : i === 3 ? 'levels' : 'groups', n.id, n.name] as [string, string, string]),
                ].map(([k, id, label]) => (
                  <span key={k + id} className="inline-flex items-center gap-1">
                    <span className="opacity-60 text-xs">›</span>
                    <button
                      className="text-xs font-bold hover:underline"
                      style={{ color: 'var(--gold)' }}
                      onClick={() => { setStack(stack.filter((s) => s.id !== id)); setLevel(k as Level); }}
                    >
                      {label}
                    </button>
                  </span>
                ))}
                <span className="text-xs font-bold text-[var(--muted)]">← {LevelName[level]}</span>
              </div>
              <span className="text-xs text-[var(--muted)] hidden md:block">{nodes.length} عنصر</span>
            </div>

            <form onSubmit={addNode} className="flex gap-2 mb-4">
              <input className="input flex-1" placeholder={`إضافة ${LevelName[level].slice(0, -1)} جديد…`} value={addName} onChange={(e) => setAddName(e.target.value)} />
              <button className="btn btn-gold" disabled={addBusy || !addName.trim()}><Plus size={16} /> إضافة</button>
            </form>
            {addErr && <div className="text-sm mb-3 text-[#ff9b94]">{addErr}</div>}

            {(level === 'states' ? nodes : stack.length > 0 ? nodes : []).length === 0 ? (
              <Empty title={`لا ${LevelName[level]} بعد`} hint="أضف عناصر لتكون البنية متاحة عند التسجيل" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {nodes.map((n) => (
                  <button key={n.id} className="btn justify-between text-right text-sm" onClick={() => Nav(n)}>
                    <span>{n.name}</span>
                    <span className="inline-flex items-center gap-1">
                      {n._count && Object.values(n._count)[0] > 0 && (
                        <span className="text-[11px] text-[var(--muted)]">{Object.values(n._count)[0]}</span>
                      )}
                      <ChevronLeft size={15} className="opacity-40" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* المستخدمون */}
        {tab === 'users' && (
          <div className="card p-5 fade-up">
            <input className="input mb-4" placeholder="ابحث بالاسم أو البريد…" value={userQ} onChange={(e) => setUserQ(e.target.value)} />
            <div className="space-y-2">
              {users.length === 0 && <div className="text-sm text-[var(--muted)]">لا يوجد مستخدمون</div>}
              {users
                .filter((u) => !userQ || (u.firstName + u.lastName + u.email).toLowerCase().includes(userQ.toLowerCase()))
                .map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,.03)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm flex items-center gap-2">
                        {u.firstName} {u.lastName}
                        {u.role === 'ADMIN' ? <ShieldCheck size={14} style={{ color: 'var(--gold)' }} /> : null}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] truncate" dir="ltr">{u.email}</div>
                      {u.membership && <div className="text-[11px] text-[var(--muted)]">فوج: {u.membership.group.name}</div>}
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      {u.role === 'ADMIN' ? (
                        <button className="btn btn-ghost px-2 py-1" onClick={() => userAct(u.id, 'make-student')}>جعله طالبًا</button>
                      ) : (
                        <button className="btn btn-ghost px-2 py-1" style={{ color: 'var(--gold)' }} onClick={() => userAct(u.id, 'make-admin')}>جعله مديرًا</button>
                      )}
                      {!u.emailVerifiedAt && (
                        <button className="btn btn-ghost px-2 py-1" style={{ color: 'var(--ok)' }} onClick={() => userAct(u.id, 'verify')}>تأكيد</button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* البلاغات */}
        {tab === 'reports' && (
          <div className="space-y-2 fade-up">
            {reports.length === 0 ? (
              <Empty title="لا بلاغات معلقة" hint="حالة نظيفة — استمر 👏" />
            ) : (
              reports.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm inline-flex items-center gap-2">
                        <Flag size={14} style={{ color: '#ff9b94' }} />
                        بلاغ عن {TYPE_LABEL[r.type] || r.type} في فوج «{r.group.name}»
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1">السبب: {REPORT_REASONS.includes(r.reason as never) ? r.reason : r.reason}</div>
                      {r.content && <div className="text-xs mt-1 text-[var(--muted)]">ملاحظة: {r.content}</div>}
                      <div className="text-[10px] text-[var(--muted)] mt-1">من: {r.reporter.firstName} {r.reporter.lastName} · <TimeAgo date={r.createdAt} /></div>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost px-2 py-1 text-xs" style={{ color: 'var(--ok)' }} onClick={() => reportAct(r.id, 'resolve')}>حل</button>
                      <button className="btn btn-ghost px-2 py-1 text-xs" style={{ color: 'var(--muted)' }} onClick={() => reportAct(r.id, 'dismiss')}>إسقاط</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}

const layoutDashboard = LayoutDashboard;
const network = Network;
const usersIcon = Users;
const flagIcon = Flag;