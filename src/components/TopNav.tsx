'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, User, Search, LayoutDashboard, Menu, X, Users } from 'lucide-react';
import { apiPost } from '@/lib/client';

type Me = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    gender?: 'MALE' | 'FEMALE' | null;
    emailVerified: boolean;
  } | null;
  group: { id: string; name: string; supervisorId: string | null } | null;
  unread: number;
};

let meCache: Me | null = null;

const PAGE_NAMES: Record<string, string> = {
  '/room': 'الرئيسية',
  '/room/subjects': 'المقاييس',
  '/room/assignments': 'الواجبات',
  '/room/schedule': 'الجدول الأسبوعي',
  '/room/announcements': 'المواضيع المهمة',
  '/room/chat': 'الدردشة العامة',
  '/room/members': 'الأعضاء',
  '/notifications': 'الإشعارات',
  '/search': 'البحث',
  '/profile': 'الملف الشخصي',
  '/admin': 'لوحة التحكم',
};

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(meCache);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      meCache = d;
      setMe(d);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  if (!me?.user) return null;

  const inAuthPage = ['/login', '/register', '/verify'].some((p) => pathname.startsWith(p));
  const inLanding = pathname === '/';
  const firstName = me.user.firstName;

  const logout = async () => {
    await apiPost('/api/auth/logout');
    meCache = null;
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)]" style={{ background: 'rgba(58,36,71,.92)', backdropFilter: 'blur(14px)' }}>
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {me.user.role === 'ADMIN' && (
            <Link href="/admin" className="btn btn-ghost px-3 py-2 text-sm">
              <LayoutDashboard size={16} /> لوحة الإدارة
            </Link>
          )}

          <div className="relative">
            <button className="btn btn-ghost p-2 relative" onClick={() => setNotifOpen((v) => !v)} aria-label="الإشعارات">
              <Bell size={18} />
              {me.unread > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-[16px] h-4 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {me.unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="card absolute left-0 top-12 w-72 p-2 fade-up z-50">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="font-bold text-sm">الإشعارات</span>
                  <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-[var(--gold)]">
                    عرض الكل
                  </Link>
                </div>
                <div className="text-xs text-[var(--muted)] px-2 py-3 text-center">
                  لديك {me.unread} إشعار جديد
                </div>
              </div>
            )}
          </div>

          <Link href="/profile" className="btn btn-ghost px-2 py-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <User size={16} />
              <span className="max-w-24 truncate">{firstName}</span>
            </span>
          </Link>

          <button className="btn btn-ghost p-2" onClick={logout} aria-label="تسجيل الخروج">
            <LogOut size={16} />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {me.group && !inAuthPage && (
            <>
              <Link href="/room" className="btn btn-ghost px-3 py-2 text-sm">الرئيسية</Link>
              <Link href="/room/subjects" className="btn btn-ghost px-3 py-2 text-sm">المقاييس</Link>
              <Link href="/room/chat" className="btn btn-ghost px-3 py-2 text-sm">الدردشة</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-ghost p-2 lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="قائمة">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href={inAuthPage || inLanding ? '/landing' : '/room'} className="flex items-center gap-2.5">
            <span className="flex flex-col leading-none">
              <span className="text-base font-black tracking-wide" style={{ color: 'var(--gold)' }}>
                EDU&nbsp;PRO
              </span>
              <span className="text-[10px] font-bold opacity-70 mt-0.5">{PAGE_NAMES[pathname] ?? ''}</span>
            </span>
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-[var(--line)] px-4 py-3 grid grid-cols-2 gap-2 fade-up">
          <Link href="/room" className="btn">الرئيسية</Link>
          <Link href="/room/subjects" className="btn">المقاييس</Link>
          <Link href="/room/chat" className="btn">الدردشة</Link>
          <Link href="/room/members" className="btn"><Users size={16} /> الأعضاء</Link>
          <Link href="/search" className="btn"><Search size={16} /> البحث</Link>
          <Link href="/notifications" className="btn"><Bell size={16} /> الإشعارات</Link>
          <Link href="/profile" className="btn"><User size={16} /> ملفي</Link>
          <button className="btn" onClick={logout}><LogOut size={16} style={{ color: '#ff9b94' }} /> تسجيل الخروج</button>
        </div>
      )}
    </header>
  );
}