'use client';

import { ReactNode } from 'react';
import { FileText, Image, FileArchive, Users, Shield, X, Flag, Clock } from 'lucide-react';
import { FILE_STATUS_LABEL, FILE_EXT_LABEL } from '@/lib/constants';

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
    />
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-4xl mb-3 opacity-40">🔍</div>
      <div className="font-bold text-lg">{title}</div>
      {hint && <div className="text-sm text-[var(--muted)] mt-1">{hint}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative w-full max-w-md p-6 fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button className="btn btn-ghost p-2" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function GenderDot({ gender, size = 26 }: { gender?: 'MALE' | 'FEMALE' | null; size?: number }) {
  const female = gender === 'FEMALE';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold ${female ? 'gender-dot-female' : 'gender-dot-male'}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      title={female ? 'أنثى' : 'ذكر'}
    >
      {female ? 'س' : 'ر'}
    </span>
  );
}

export function SupervisorBadge() {
  return (
    <span className="badge-supervisor">
      <Shield size={11} />
      مشرف الفوج
    </span>
  );
}

export function FileTypeIcon({ mimeType, size = 40 }: { mimeType: string; size?: number }) {
  const label = FILE_EXT_LABEL[mimeType] || mimeType.split('/')[1]?.slice(0, 4)?.toUpperCase() || 'ملف';
  const isImage = mimeType.startsWith('image/');
  const isZip = mimeType.includes('zip') || mimeType.includes('rar');
  const Icon = isImage ? Image : isZip ? FileArchive : FileText;
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl border border-[var(--line)]"
      style={{
        width: size,
        height: size,
        background: isImage
          ? 'rgba(63,191,127,.1)'
          : isZip
            ? 'rgba(201,169,98,.12)'
            : 'rgba(42,67,112,.2)',
        color: isImage ? 'var(--ok)' : isZip ? 'var(--gold)' : '#c9a962',
      }}
    >
      <Icon size={size * 0.45} />
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { c: string; bg: string }> = {
    PENDING: { c: '#e8c87a', bg: 'rgba(201,169,98,.12)' },
    PUBLISHED: { c: '#3fbf7f', bg: 'rgba(63,191,127,.12)' },
    REJECTED: { c: '#ff9b94', bg: 'rgba(228,87,87,.12)' },
    DELETED: { c: '#a89f92', bg: 'rgba(150,140,125,.12)' },
  };
  const m = map[status] || map.PUBLISHED;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ color: m.c, background: m.bg, border: '1px solid currentColor', opacity: 0.9 }}
    >
      {FILE_STATUS_LABEL[status as keyof typeof FILE_STATUS_LABEL] || status}
    </span>
  );
}

export function TimeAgo({ date }: { date: string | Date }) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span className="inline-flex items-center gap-1"><Clock size={11} /> الآن</span>;
  if (mins < 60) return <span>{mins} د</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} س</span>;
  const days = Math.floor(hrs / 24);
  if (days < 7) return <span>{days} ي</span>;
  return (
    <span>
      {d.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' })}
    </span>
  );
}

export function ReportButton({
  reason,
  extra,
  onReport,
  busy,
}: {
  reason?: string;
  extra?: string;
  onReport: (reason: string, extra?: string) => void;
  busy?: boolean;
}) {
  return (
    <button
      className="btn btn-ghost p-2"
      onClick={() => {
        const r = window.prompt('سبب البلاغ:', reason || 'محتوى غير لائق');
        if (r === null) return;
        onReport(r.trim() || 'محتوى غير لائق', extra);
      }}
      title="إبلاغ"
      disabled={busy}
    >
      <Flag size={15} />
    </button>
  );
}

export function EmptyCard({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card p-8 text-center">
      <div className="text-4xl mb-3 opacity-40">📭</div>
      <div className="font-bold">{title}</div>
      {hint && <div className="text-sm text-[var(--muted)] mt-1">{hint}</div>}
    </div>
  );
}

export { Users };