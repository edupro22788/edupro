'use client';

import { useEffect, useState } from 'react';
import { Quote as QuoteIcon, RefreshCw } from 'lucide-react';
import { QUOTES } from '@/lib/quotes';

const ROTATE_MS = 15000;
const TOTAL = QUOTES.length;

export default function QuotePanel() {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPos((p) => (p + 1) % TOTAL), ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  const quote = QUOTES[pos];
  const next = () => setPos((p) => (p + 1) % TOTAL);

  return (
    <aside className="card p-6 min-h-0 overflow-y-auto flex flex-col items-center justify-center text-center gap-5" style={{ borderColor: 'var(--gold)' }}>
      <span
        className="text-[11px] tracking-wide rounded-full px-3 py-1"
        style={{ background: 'rgba(201,169,98,.12)', color: 'var(--gold)' }}
      >
        من هدي العلم والأخلاق
      </span>
      <QuoteIcon size={30} style={{ color: 'var(--gold-3)' }} />
      <blockquote
        key={pos}
        className="fade-up whitespace-pre-line text-lg md:text-xl leading-loose font-bold"
        style={{ color: '#f3e7c8' }}
      >
        {quote.text}
      </blockquote>
      {quote.source && <span className="text-xs text-[var(--muted)]">— {quote.source}</span>}
      <button type="button" onClick={next} className="btn btn-ghost px-4 py-2 mt-1">
        <RefreshCw size={15} /> مقولة أخرى
      </button>
    </aside>
  );
}
