export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 بايت';
  const units = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : value >= 100 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(d: Date | string | number): string {
  const date = new Date(d);
  return new Intl.DateTimeFormat('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(d: Date | string | number): string {
  const date = new Date(d);
  return new Intl.DateTimeFormat('ar-DZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(t: string): string {
  // تنسيق "HH:mm"
  if (!/^\d{1,2}:\d{2}$/.test(t)) return t;
  const [h, m] = t.split(':').map(Number);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** تهيئة نص لعنوان URL */
export function safeFileName(name: string): string {
  return name.replace(/[^\p{L}\p{N}._ -]/gu, '_').trim();
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** تحويل التاريخ من حقل input type="date" إلى تاريخ */
export function dateInputToDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}