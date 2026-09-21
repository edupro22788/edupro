'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, ClipboardList, MessagesSquare, CalendarDays, Pin, Bell, Search, User } from 'lucide-react';

const items = [
  { href: '/room', label: 'الرئيسية', icon: Home },
  { href: '/room/subjects', label: 'المقاييس', icon: BookOpen },
  { href: '/room/assignments', label: 'الواجبات', icon: ClipboardList },
  { href: '/room/chat', label: 'الدردشة العامة', icon: MessagesSquare },
  { href: '/room/schedule', label: 'الجدول الأسبوعي', icon: CalendarDays },
  { href: '/room/announcements', label: 'المواضيع المهمة', icon: Pin },
  { href: '/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/search', label: 'البحث', icon: Search },
  { href: '/profile', label: 'ملفي', icon: User },
];

export default function SideNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/room') return pathname === '/room';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside
      className="fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-2 p-1.5 rounded-2xl border border-[var(--line)]"
      style={{ background: 'rgba(80,47,94,.95)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 44px rgba(28,8,32,.5)' }}
      aria-label="شريط التنقل"
    >
      {items.map((it) => {
        const active = isActive(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            title={it.label}
            aria-label={it.label}
            className="box3d sidenav-item block relative"
            style={{ zIndex: active ? 2 : undefined }}
          >
            <div className="gold-box p-0.5" style={active ? { filter: 'brightness(1.12)' } : undefined}>
              <div className="box-top" />
              <div
                className="relative z-10 flex items-center justify-center rounded-lg"
                style={{
                  width: 34,
                  height: 34,
                  background: 'linear-gradient(145deg,#5d3a6c,#3a2447)',
                  border: '1px solid rgba(201,169,98,.35)',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,.4)',
                }}
              >
                <it.icon size={17} strokeWidth={2.2} style={{ color: '#e8c87a' }} />
              </div>
            </div>
            {active && (
              <span
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                style={{ background: 'linear-gradient(180deg,#e8c87a,#c9a962)', boxShadow: '0 0 10px rgba(201,169,98,.9)' }}
              />
            )}
          </Link>
        );
      })}
    </aside>
  );
}