'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { apiGet } from '@/lib/client';
import { Spinner, GenderDot, SupervisorBadge } from '@/components/ui';

type Me = {
  user: {
    id: string; firstName: string; lastName: string; email: string; role: string;
    gender: 'MALE' | 'FEMALE' | null; emailVerified: boolean; createdAt: string;
  };
  group: { id: string; name: string } | null;
};

type Room = {
  group: { name: string; path: { state: string; university: string; faculty: string; major: string; level: string }; members: number };
  isSupervisor: boolean;
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const m = await apiGet<Me>('/api/auth/me');
      if (m.ok && m.data.user) setMe(m.data);
      if (m.ok && m.data.user) {
        const r = await apiGet<Room>('/api/room');
        if (r.ok) setRoom(r.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={28} /></div>;
  if (!me) return null;

  const joined = new Date(me.user.createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows = [
    ['البريد الإلكتروني', me.user.email],
    ['الدور', me.user.role === 'ADMIN' ? 'مدير النظام' : 'طالب'],
    ['الجنس', me.user.gender === 'FEMALE' ? 'أنثى' : 'ذكر'],
    ['البريد مؤكد', me.user.emailVerified ? 'نعم ✓' : 'لا — لم يتم التأكيد بعد'],
    ['تاريخ الانضمام', joined],
  ];

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-black mb-6">ملفي الشخصي</h1>

        <div className="card relative overflow-hidden p-6 mb-5">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(400px 140px at 85% 0%, rgba(201,169,98,.12), transparent 60%)' }} />
          <div className="relative flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <GenderDot gender={me.user.gender} size={64} />
              {room?.isSupervisor && <SupervisorBadge />}
            </div>
            <div>
              <h2 className="text-2xl font-black">{me.user.firstName} {me.user.lastName}</h2>
              {room?.group ? (
                <p className="text-sm text-[var(--muted)] mt-1">
                  {room.group.path.university} — {room.group.path.major} — {room.group.name}
                </p>
              ) : (
                <p className="text-sm text-[var(--muted)] mt-1">لم تحدد فوجك بعد</p>
              )}
              {room && <div className="text-[11px] text-[var(--muted)] mt-1.5">أعضاء فوجك: {room.group.members}</div>}
            </div>
          </div>
        </div>

        <div className="card p-6">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 border-b border-[var(--line)] last:border-b-0">
              <span className="text-sm text-[var(--muted)]">{k}</span>
              <span className="text-sm font-bold" style={k === 'البريد مؤكد' && v.includes('لا') ? { color: '#ff9b94' } : undefined}>{v}</span>
            </div>
          ))}
        </div>

        {!me.user.emailVerified && (
          <Link href="/verify" className="btn btn-gold w-full mt-4">تأكيد البريد الآن</Link>
        )}
        {me.user.role === 'ADMIN' && (
          <Link href="/admin" className="btn w-full mt-3">لوحة إدارة النظام</Link>
        )}
        <Link href="/" className="btn btn-ghost w-full mt-3">
          <User size={16} /> العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </>
  );
}