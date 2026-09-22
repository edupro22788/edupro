export const PLATFORM = {
  name: 'EDU PRO',
  tagline: 'التعاون المعرفي الجامعي',
};

export const CONTENT_CATEGORIES = {
  LESSON: 'دروس',
  SUMMARY: 'ملخصات',
  REVISION: 'مراجعات',
  LECTURE: 'محاضرات',
  EXERCISE: 'تمارين',
  FILE: 'ملفات',
} as const;

export const CATEGORY_ORDER = ['LESSON', 'SUMMARY', 'REVISION', 'LECTURE', 'EXERCISE', 'FILE'] as const;

export const CATEGORY_LABELS = CONTENT_CATEGORIES;

export const FILE_STATUS_LABEL = {
  PENDING: 'قيد المراجعة',
  PUBLISHED: 'منشور',
  REJECTED: 'مرفوض',
  DELETED: 'محذوف',
} as const;

export const ANNOUNCEMENT_TYPES = {
  PROF_ABSENCE: 'غياب أستاذ',
  SCHEDULE_CHANGE: 'تغيير حصة',
  ROOM_CHANGE: 'تغيير القاعة',
  POSTPONEMENT: 'تأجيل درس',
  TIME_CHANGE: 'تغيير التوقيت',
  IMPORTANT: 'إعلان مهم',
  STUDY_ALERT: 'تنبيه دراسي',
} as const;

export const REPORT_REASONS = [
  'محتوى مسيء أو غير لائق',
  'محتوى غير أكاديمي',
  'انتحال/محتوى مكرر',
  'ملف تالف أو مضلل',
  'إساءة استخدام المنصة',
  'أخرى',
] as const;

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_FILE_EXTS = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-tar',
  'application/octet-stream',
];

export const FILE_EXT_LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'صورة',
  'image/jpeg': 'صورة',
  'image/webp': 'صورة',
  'image/gif': 'صورة',
  'text/plain': 'نص',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-powerpoint': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/zip': 'مضغوط',
  'application/x-zip-compressed': 'مضغوط',
  'application/x-zip': 'مضغوط',
  'application/x-rar-compressed': 'مضغوط',
  'application/vnd.rar': 'مضغوط',
  'application/x-tar': 'مضغوط',
  'application/octet-stream': 'ملف',
};

export const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export const SUBJECT_ICONS = [
  { key: 'academic', label: 'أكاديمي' },
  { key: 'brain', label: 'عقل' },
  { key: 'stats', label: 'إحصاء' },
  { key: 'flask', label: 'مخبر' },
  { key: 'book', label: 'كتاب' },
  { key: 'shield', label: 'درع' },
  { key: 'scale', label: 'ميزان' },
  { key: 'globe', label: 'عالم' },
  { key: 'calculator', label: 'حاسبة' },
  { key: 'microscope', label: 'مجهر' },
] as const;