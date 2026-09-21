'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { apiGet, apiPost } from '@/lib/client';
import { Spinner, Empty, TimeAgo } from '@/components/ui';

type Notif = { id: string; type: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await apiGet<{ notifications: Notif[] }>('/api/notifications');
    if (r.ok) setItems(r.data.notifications);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await apiPost('/api/notifications/read-all');
    setItems((s) => s.map((n) => ({ ...n, read: true })));
  };

  const markOne = async (n: Notif) => {
    if (n.read) return;
    await apiPost(`/api/notifications/${n.id}/read`);
    setItems((s) => s.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size={28} /></div>;

  const unread = items.filter((n) => !n.read).length;

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black inline-flex items-center gap-2"><Bell size={20} style={{ color: 'var(--gold)' }} /> الإشعارات</h1>
          {unread > 0 && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: 'rgba(201,169,98,.15)', color: 'var(--gold)' }}>{unread} جديد</span>}
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost text-sm px-3 py-1.5" onClick={markAll}>تعليم الكل كمقروء</button>
        )}
      </div>

      {items.length === 0 ? (
        <Empty title="لا توجد إشعارات" hint="ستصلك إشعارات عند رفع ملفات ونشر إعلانات في فوجك" />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`card p-3.5 flex items-start gap-3 ${n.read ? 'opacity-55' : ''}`}
              onClick={() => markOne(n)}
              style={n.read ? undefined : { borderColor: 'rgba(201,169,98,.35)' }}
            >
              <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: n.read ? 'transparent' : 'var(--gold)' }} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{n.title}</div>
                <div className="text-sm text-[var(--muted)] mt-0.5 line-clamp-2">{n.body}</div>
                <div className="text-[10px] text-[var(--muted)] mt-1"><TimeAgo date={n.createdAt} /></div>
              </div>
              {n.link && <Link href={n.link} className="btn btn-ghost text-xs px-2 py-1 shrink-0">افتح</Link>}
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}