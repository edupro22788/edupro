'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Ban, CheckCircle2, Users } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/client';
import { Spinner, GenderDot, SupervisorBadge, TimeAgo } from '@/components/ui';

type Member = {
  id: string; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE' | null;
  joinedAt: string; loginCount: number; lastLoginAt: string | null;
  chatBannedAt: string | null; me: boolean;
};

type MembersData = {
  supervisor: { id: string; firstName: string; lastName: string } | null;
  isSupervisor: boolean;
  members: Member[];
};

export default function MembersPage() {
  const [data, setData] = useState<MembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    const r = await apiGet<MembersData>('/api/members');
    if (r.ok) { setData(r.data); setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleBan = async (m: Member) => {
    const unban = Boolean(m.chatBannedAt);
    if (!unban && !confirm(`حظر ${m.firstName} ${m.lastName} من الدردشة؟`)) return;
    setBusyId(m.id);
    const r = await apiPost(`/api/members/${m.id}`, { action: unban ? 'unban' : 'ban' });
    setBusyId('');
    if (r.ok) load();
    else alert(r.error);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={28} /></div>;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="breadcrumb mb-1">
        <Link href="/room">غرفتي</Link><span className="sep">›</span><span className="current">الأعضاء</span>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black inline-flex items-center gap-2"><Users size={20} style={{ color: 'var(--purple)' }} /> أعضاء الفوج</h1>
          <div className="text-sm text-[var(--muted)] mt-1 flex items-center gap-1.5">
            {data.supervisor
              ? <><Shield size={14} style={{ color: 'var(--gold)' }} /> المشرف: {data.supervisor.firstName} {data.supervisor.lastName} <SupervisorBadge /></>
              : 'لا يوجد مشرف بعد'}
          </div>
        </div>
        {data.isSupervisor && <span className="text-[11px] text-[var(--muted)]">بإمكانك حظر الأعضاء من الدردشة</span>}
      </div>

      <div className="space-y-2">
        {data.members.map((m) => (
          <div key={m.id} className="card p-3.5 flex items-center gap-3">
            <GenderDot gender={m.gender} size={36} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                <span>{m.me ? 'أنت' : `${m.firstName} ${m.lastName}`}</span>
                {data.supervisor?.id === m.id && <SupervisorBadge />}
                {m.chatBannedAt && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,107,.15)', color: '#ff9b94' }}>
                    محظور من الشات
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                انضم {new Date(m.joinedAt).toLocaleDateString('ar-DZ')} · عدد مرات الدخول: {m.loginCount}
                {m.lastLoginAt && <> · آخر دخول <TimeAgo date={m.lastLoginAt} /></>}
              </div>
            </div>
            {data.isSupervisor && !m.me && (
              <button
                className={`btn btn-ghost text-xs px-3 py-1.5 shrink-0`}
                style={{ color: m.chatBannedAt ? 'var(--ok)' : '#ff9b94' }}
                onClick={() => toggleBan(m)}
                disabled={busyId === m.id}
              >
                {busyId === m.id ? <Spinner size={14} /> : m.chatBannedAt ? <><CheckCircle2 size={13} /> إلغاء الحظر</> : <><Ban size={13} /> حظر من الشات</>}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}