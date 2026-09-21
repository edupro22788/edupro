// توحيد أسماء الأفواج: الرقم دائمًا بخانتين (01، 02، 03 … 99، 100 …)
// يمنع تكرار الأفواج مثل «الفوج 5» و«الفوج 05» ككيانين منفصلين.

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

function toAsciiDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)));
}

export function normalizeGroupName(raw: string): string {
  const t = toAsciiDigits(raw.trim()).replace(/\s+/g, ' ');
  const m = t.match(/^(.*?)(\d+)\s*$/);
  if (!m) return t;
  const prefix = m[1].trim() || 'الفوج';
  const num = parseInt(m[2], 10);
  const padded = num < 10 ? `0${num}` : String(num);
  return `${prefix} ${padded}`;
}