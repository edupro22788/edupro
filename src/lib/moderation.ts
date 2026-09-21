const charMap: Record<string, string> = {
  أ: 'ا', إ: 'ا', آ: 'ا', ٱ: 'ا',
  ى: 'ي', ئ: 'ي',
  ة: 'ه', ؤ: 'و', 4: 'ا', 3: 'ع', 7: 'ح', 0: 'و', 2: 'ء', 5: 'خ', 8: 'ق', 9: 'ص',
};

export function normalizeArabic(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .split('')
    .map((c) => charMap[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^ا-يa-z0-9]/g, '');
}

const ARABIC_WORDS = [
  'كس', 'كسخت', 'كسك', 'قحبه', 'قحبت', 'كحبه', 'كحبت', 'عرص', 'عرصت',
  'شرموطه', 'شرموط', 'شرميط', 'خنيزه', 'خنزير', 'زنا', 'زنت', 'زبر', 'زبي',
  'متناك', 'منيك', 'منيوك', 'نيك', 'ينيك', 'خره', 'خارا', 'هبله', 'خول',
  'قواد', 'قواده', 'قوادين', 'طيز', 'تيز', 'زبل', 'زبال', 'زباله', 'خامج',
  'خماج', 'مسخوط', 'سفله', 'سافل', 'سفاله', 'حقير', 'وقح', 'قذر', 'قذاره',
  'بهيم', 'بهيمه', 'كلب', 'كلبه', 'حمار', 'حمير', 'حماره', 'غبي', 'غبيه',
];

const BAD_ARABIC = Array.from(new Set(ARABIC_WORDS.map(normalizeArabic).filter(Boolean)));

const latinMap: Record<string, string> = {
  2: 'a', 3: 'a', 4: 'a', 5: 'kh', 6: 't', 7: 'h', 8: 'g', 9: 'q', 0: 'o', 1: 'i',
};

function normalizeLatin(s: string): string {
  return s
    .toLowerCase()
    .split('')
    .map((c) => latinMap[c] || c)
    .join('')
    .replace(/[^a-z]/g, '');
}

const LATIN_WORDS = [
  'kahba', 'qahba', 'kess', 'kes', 'zebi', 'zabi', 'zob', 'zeb', 'nik', 'nayak',
  'nayek', 'niyak', 'tiz', 'teez', 'tizz', '3ars', 'qawad', 'kawad', 'qawada',
  'charmout', 'charmota', 'charmuta', 'sharmouta', 'sharmuta', 'mniouk', 'manyak',
  'manouk', 'khawal', 'khwal', 'hallouf', 'zamel', 'zaml', 'zbel', 'zbal', 'zbala',
  'khamaj', 'khamj', 'maskhout', 'safl', 'haqir', 'waqeh', 'qazer', 'bhim', 'kalb',
  'kalba', 'hmar', 'hmara', 'ghabi', 'ghabiya',
];

const BAD_LATIN = new Set(LATIN_WORDS.map(normalizeLatin).filter(Boolean));
const BAD_LATIN_EXACT = new Set(BAD_LATIN);
const BAD_LATIN_SUB = Array.from(BAD_LATIN).filter((w) => w.length >= 5);

export function containsOffensive(input: string): boolean {
  const arabic = normalizeArabic(input);
  if (arabic && BAD_ARABIC.some((w) => arabic.includes(w))) return true;

  const latinTokens = (input.match(/[a-zA-Z0-9]+/g) || [])
    .map(normalizeLatin)
    .filter(Boolean);
  return latinTokens.some(
    (t) => BAD_LATIN_EXACT.has(t) || BAD_LATIN_SUB.some((w) => t.includes(w)),
  );
}
