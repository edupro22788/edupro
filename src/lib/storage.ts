import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const BASE = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(ROOT, 'data', 'uploads');

export type SavedFile = {
  fileName: string;
  storedName: string;
  storedPath: string;
  mimeType: string;
  sizeBytes: number;
};

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function uploadBaseDir(): string {
  return BASE;
}

/** يحفظ ملفًا داخل مجلد فوجه مع اسم عشوائي لا يمكن التخمين به */
export function saveUpload(buffer: Buffer, originalName: string, mimeType: string, groupId: string): SavedFile {
  const safeOriginal = (path.basename(originalName) || 'file')
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .trim()
    .slice(0, 120);

  const ext = path.extname(safeOriginal).toLowerCase().slice(0, 10);
  const year = new Date().getFullYear();
  const dir = path.join(BASE, String(groupId), String(year));
  ensureDir(dir);

  const storedName = `${Date.now()}_${crypto.randomBytes(12).toString('hex')}${ext}`;
  const storedPath = path.join('data', 'uploads', String(groupId), String(year), storedName);

  fs.writeFileSync(path.join(BASE, String(groupId), String(year), storedName), buffer);
  return {
    fileName: safeOriginal,
    storedName,
    storedPath,
    mimeType,
    sizeBytes: buffer.length,
  };
}

/** يحوّل مسارًا نسبيًا مخزّنًا إلى مسار مطلق بعد التحقق أنه داخل قاعدة التحميلات */
export function resolveStoredPath(storedPath: string): string | null {
  if (path.isAbsolute(storedPath)) {
    const abs = path.resolve(storedPath);
    return abs.startsWith(BASE) && fs.existsSync(abs) ? abs : null;
  }
  const absolute = path.join(BASE, storedPath.replace(/^data[\\/]uploads[\\/]/, ''));
  if (!fs.existsSync(absolute)) return null;
  if (!absolute.startsWith(BASE)) return null;
  return absolute;
}

export function deleteStoredFile(storedPath?: string | null): void {
  if (!storedPath) return;
  const absolute = resolveStoredPath(storedPath);
  if (!absolute) return;
  try {
    fs.unlinkSync(absolute);
  } catch {
    /* تجاهل */
  }
}

export function readStoredFile(absolute: string): Buffer | null {
  try {
    return fs.readFileSync(absolute);
  } catch {
    return null;
  }
}

export function statStoredFile(absolute: string): { size: number; mtime: Date } | null {
  try {
    const s = fs.statSync(absolute);
    return { size: s.size, mtime: s.mtime };
  } catch {
    return null;
  }
}