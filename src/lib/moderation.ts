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

const BAD_WORDS = [
  'كس', 'كسخت', 'كسك', 'قحبه', 'قحبت', 'كحبه', 'كحبت', 'عرص', 'عرصت',
  'شرموطه', 'شرموط', 'خنيزه', 'زنا', 'زنت', 'زب', 'زبر', 'تيز', 'متناك',
  'نيك', 'ينيك', 'منيك', 'منيوك', 'خره', 'خارا', 'هبله', 'خول',
];

export function containsOffensive(input: string): boolean {
  const text = normalizeArabic(input);
  if (!text) return false;
  return BAD_WORDS.some((w) => text.includes(w));
}