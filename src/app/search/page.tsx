'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Search, FileText, ClipboardList, Pin, MessagesSquare, User, BookOpen } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { apiGet } from '@/lib/client';
import { Spinner, Empty, TimeAgo, GenderDot } from '@/components/ui';
import NextArrow from '@/components/NextArrow';

type Results = {
  files: { id: string; title: string; category: string; createdAt: string }[];
  assignments: { id: string; title: string; createdAt: string }[];
  announcements: { id: string; title: string; createdAt: string }[];
  messages: { id: string; content: string; createdAt: string }[];
  members: { id: string; name: string; gender: 'MALE' | 'FEMALE' | null }[];
  subjects: { id: string; name: string }[];
};

const CONTENT_CATEGORIES = {
  LESSON: 'دروس', SUMMARY: 'ملخصات', REVISION: 'مراجعات', LECTURE: 'محاضرات', EXERCISE: 'تمارين', FILE: 'ملفات',
};

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) { setResults(null); setSearched(false); return; }
    setLoading(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const r = await apiGet<{ q: string; results: Results }>(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (r.ok) { setResults(r.data.results); setSearched(true); }
      setLoading(false);
    }, 350);
    return () => clearTimeout(debounce.current);
  }, [q]);

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-black mb-1">البحث في الفوج</h1>
        <p className="text-sm text-[var(--muted)] mb-5">ابحث في الملفات والواجبات والمواضيع المهمة والدردشة وزملائك</p>

        <div className="relative mb-6">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            className="input pr-11 text-base" placeholder="مثال: علم النفس العصبي…"
            value={q} onChange={(e) => setQ(e.target.value)} autoFocus
          />
        </div>

        {loading && <div className="flex justify-center py-10"><Spinner size={26} /></div>}

        {!loading && !searched && <Empty title="ابدأ بالبحث" hint="اكتب كلمة أو اسمًا للبحث" />}

        {!loading && searched && results && !results.files.length && !results.assignments.length &&
          !results.announcements.length && !results.messages.length && !results.members.length && !results.subjects.length && (
          <Empty title="لا نتائج" hint={`لا شيء يطابق «${q}»`} />
        )}

        {results && (
          <div className="space-y-6">
            {results.files.length > 0 && (
              <Section title="الملفات" icon={<FileText size={15} />} color="var(--gold)">
                {results.files.map((f) => (
                  <LinkRow key={f.id} href="/room/subjects">
                    <span className="font-bold">{f.title}</span>
                    <span className="text-[11px]" style={{ color: 'var(--gold)' }}>{CONTENT_CATEGORIES[f.category as keyof typeof CONTENT_CATEGORIES]}</span>
                  </LinkRow>
                ))}
              </Section>
            )}
            {results.subjects.length > 0 && (
              <Section title="المقاييس" icon={<BookOpen size={15} />} color="var(--purple)">
                {results.subjects.map((s) => (
                  <LinkRow key={s.id} href={`/room/subjects/${s.id}`}>
                    <span className="font-bold">{s.name}</span>
                  </LinkRow>
                ))}
              </Section>
            )}
            {results.assignments.length > 0 && (
              <Section title="الواجبات" icon={<ClipboardList size={15} />} color="var(--purple)">
                {results.assignments.map((a) => (
                  <LinkRow key={a.id} href="/room/assignments">
                    <span className="font-bold">{a.title}</span>
                    <TimeAgo date={a.createdAt} />
                  </LinkRow>
                ))}
              </Section>
            )}
            {results.announcements.length > 0 && (
              <Section title="المواضيع المهمة" icon={<Pin size={15} />} color="var(--gold)">
                {results.announcements.map((a) => (
                  <LinkRow key={a.id} href="/room/announcements">
                    <span className="font-bold">{a.title}</span>
                    <TimeAgo date={a.createdAt} />
                  </LinkRow>
                ))}
              </Section>
            )}
            {results.messages.length > 0 && (
              <Section title="رسائل الدردشة" icon={<MessagesSquare size={15} />} color="var(--ok)">
                {results.messages.map((m) => (
                  <LinkRow key={m.id} href="/room/chat">
                    <span className="line-clamp-1">{m.content}</span>
                    <TimeAgo date={m.createdAt} />
                  </LinkRow>
                ))}
              </Section>
            )}
            {results.members.length > 0 && (
              <Section title="الأعضاء" icon={<User size={15} />} color="var(--pink)">
                {results.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[rgba(15,12,5,.045)]">
                    <GenderDot gender={m.gender} size={22} />
                    <span className="font-bold text-sm">{m.name}</span>
                  </div>
                ))}
              </Section>
            )}
          </div>
        )}
      </div>

      <NextArrow href="/room" />
    </>
  );
}

function Section({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-bold mb-2" style={{ color }}>
        {icon} {title}
      </div>
      <div className="card p-2 divide-y divide-[var(--line)]">
        {children}
      </div>
    </div>
  );
}

function LinkRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-[rgba(15,12,5,.045)]">
      {children}
    </Link>
  );
}