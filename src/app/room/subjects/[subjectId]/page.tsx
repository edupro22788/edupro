'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Paperclip, Eye, Download, Trash2, Check, X, Image as ImageIcon } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/client';
import {
  Spinner, Empty, Modal, FileTypeIcon, StatusPill, TimeAgo, GenderDot, ReportButton,
} from '@/components/ui';
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/constants';

// إعادة تصدير بأسماء مقروءة
const CATS: Record<string, string> = CATEGORY_LABELS;

type Subject = { id: string; name: string; icon: string; color: string };
type FileItem = {
  id: string; title: string; description: string; category: string; status: string; rejectReason: string | null;
  fileName: string; sizeBytes: number; mimeType: string; extLabel: string; createdAt: string;
  uploader: { id: string; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE' | null };
  canManage: boolean;
};
type FileWithSubject = FileItem & { subject: { id: string; name: string } | null };

const ICON_LABEL: Record<string, string> = {
  academic: '🎓', brain: '🧠', stats: '📊', flask: '🧪', book: '📘', shield: '🛡️', scale: '⚖️', globe: '🌍', calculator: '🧮', microscope: '🔬',
};

function formatBytes(bytes: number) {
  if (!bytes) return '0';
  const units = ['ب', 'كيلوبايت', 'ميغابايت', 'غيغابايت'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const subjectId = params.id;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [files, setFiles] = useState<FileWithSubject[]>([]);
  const [isSup, setIsSup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('');
  const [mine, setMine] = useState(false);
  const [pending, setPending] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [viewId, setViewId] = useState<string | null>(null);

  const load = async () => {
    const [room, subj] = await Promise.all([
      apiGet<{ isSupervisor: boolean }>('/api/room'),
      apiGet<{ subjects: Subject[] }>('/api/subjects'),
    ]);
    if (room.ok) setIsSup(room.data.isSupervisor);
    let found = subj.ok ? subj.data.subjects.find((s) => s.id === subjectId) || null : null;
    if (!found) {
      const one = await apiGet<{ subject: Subject }>(`/api/subjects/${subjectId}`);
      if (one.ok) found = one.data.subject;
    }
    setSubject(found);

    const q = new URLSearchParams({ subjectId });
    if (mine) q.set('mine', '1');
    if (pending) q.set('pending', '1');
    const r = await apiGet<{ files: FileWithSubject[] }>(`/api/files?${q}`);
    if (r.ok) setFiles(r.data.files);
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('upload') === '1') {
      setShowAdd(true);
    }
  }, []);

  useEffect(() => { load(); }, [subjectId, mine, pending]);

  const doUpload = async (file: File, asImage: boolean) => {
    if (asImage && !file.type.startsWith('image/')) return setError('الملف المحدد ليس صورة — استخدم «إدراج ملف»');
    if (!asImage && file.type.startsWith('image/')) return setError('الملف المحدد صورة — استخدم «إضافة صورة»');
    setBusy(true); setError('');
    const fd = new FormData();
    fd.set('title', file.name.replace(/\.[^.]+$/, '') || file.name);
    fd.set('category', 'FILE');
    fd.set('subjectId', subject ? subject.id : '');
    fd.set('file', file);
    const r = await apiPost('/api/files', fd);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setShowAdd(false); setError('');
    load();
  };

  const act = async (id: string, action: string, extra?: object) => {
    const r = await apiPatch(`/api/files/${id}/status`, { action, ...extra });
    if (r.ok) load();
  };

  const del = async (file: FileWithSubject) => {
    if (!confirm(`حذف «${file.title}»؟`)) return;
    await apiPatch(`/api/files/${file.id}`, { action: 'delete' });
    load();
  };

  const report = async (id: string, reason: string) => {
    await apiPost('/api/reports', { type: 'FILE', targetId: id, reason });
    alert('تم إرسال البلاغ.');
  };

  const isImage = (mime: string) => mime.startsWith('image/');
  const isPdf = (mime: string) => mime === 'application/pdf';

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size={28} /></div>;

  const viewFile = files.find((f) => f.id === viewId) || null;
  const images = files.filter((f) => f.mimeType.startsWith('image/'));
  const docs = files.filter((f) => !f.mimeType.startsWith('image/'));
  const visibleDocs = cat ? docs.filter((f) => f.category === cat) : docs;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {subject ? (
        <>
          <div className="breadcrumb mb-1">
            <Link href="/room">غرفتي</Link><span className="sep">›</span>
            <Link href="/room/subjects">المقاييس</Link><span className="sep">›</span>
            <span className="current">{subject.name}</span>
          </div>

          <div className="card p-6 mb-6 relative overflow-hidden fade-up">
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(500px 180px at 85% 0%, ${subject.color}22, transparent 60%)` }} />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{ICON_LABEL[subject.icon]}</div>
                <div>
                  <h1 className="text-2xl font-black">{subject.name}</h1>
                  <p className="text-sm text-[var(--muted)]">
                    شارك الدروس والملخصات والمراجعات والمحاضرات والتمارين للفوج
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Empty title="المقياس غير موجود" hint="إن كان المقياس من إنشائك اضغط «إضافة» للأعلى — وتأكد من تسجيل الدخول بحسابك الصحيح" />
      )}

      {/* الملفات */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-black flex items-center gap-2"><Paperclip size={17} /> الملفات ({docs.length})</h2>
        <button className="btn btn-gold" disabled={busy} onClick={() => { setError(''); setShowAdd(true); }}>
          <Plus size={16} /> إضافة
        </button>
      </div>

      {/* مرشحات */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button className={`btn text-sm px-3 py-1.5 ${cat === '' ? 'btn-gold' : ''}`} onClick={() => { setCat(''); }}>
          الكل
        </button>
        {CATEGORY_ORDER.map((k) => (
          <button key={k} className={`btn text-sm px-3 py-1.5 ${cat === k ? 'btn-gold' : ''}`} onClick={() => setCat(k)}>
            {CATS[k]}
          </button>
        ))}
        <span className="flex-1" />
        <label className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> ملفاتي فقط
        </label>
        {isSup && (
          <label className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <input type="checkbox" checked={pending} onChange={(e) => setPending(e.target.checked)} /> قيد المراجعة
          </label>
        )}
      </div>

      {visibleDocs.length === 0 ? (
        <Empty title="لا توجد ملفات هنا" hint={cat ? 'لا ملفات في هذا التصنيف — اضغط «إضافة» بالأعلى' : 'اضغط «إضافة» بالأعلى ثم «إدراج ملف» لرفع PDF أو وورد أو غيرهما'} />
      ) : (
        <div className="space-y-2">
          {visibleDocs.map((f) => (
            <div key={f.id} className="card p-3.5 flex items-center gap-3 fade-up" style={{ borderColor: cat === f.category ? 'rgba(201,169,98,.35)' : undefined }}>
              <FileTypeIcon mimeType={f.mimeType} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{f.title}</span>
                  <StatusPill status={f.status} />
                  <span className="text-[11px] rounded-md px-1.5 py-0.5" style={{ background: 'rgba(15,12,5,.045)', color: 'var(--muted)' }}>{CATS[f.category]}</span>
                  {f.status === 'REJECTED' && f.rejectReason && (
                    <span className="text-[11px] text-[#ff9b94]">— {f.rejectReason}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1"><GenderDot gender={f.uploader.gender} size={15} />{f.uploader.firstName} {f.uploader.lastName}</span>
                  <span>·</span><span>{f.extLabel} {formatBytes(f.sizeBytes)}</span>
                  <span>·</span><TimeAgo date={f.createdAt} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {f.status === 'PUBLISHED' && (
                  <>
                    <button className="btn btn-ghost p-2" onClick={() => setViewId(f.id)} title="عرض"><Eye size={16} /></button>
                    <a className="btn btn-ghost p-2" href={`/api/files/${f.id}/download`} title="تحميل"><Download size={16} /></a>
                  </>
                )}
                {(f.status === 'PENDING' || f.status === 'REJECTED') && f.canManage && (
                  <a className="btn btn-ghost p-2" href={`/api/files/${f.id}/content`} target="_blank" title="معاينة"><Eye size={16} /></a>
                )}
                {isSup && (f.status === 'PENDING' || f.status === 'REJECTED') && (
                  <>
                    <button className="btn btn-ghost p-2" style={{ color: 'var(--ok)' }} onClick={() => act(f.id, 'approve')} title="نشر"><Check size={16} /></button>
                    <button className="btn btn-ghost p-2" style={{ color: '#ff9b94' }} onClick={() => {
                      const reason = window.prompt('سبب الرفض:', 'محتوى غير مناسب');
                      if (reason !== null) act(f.id, 'reject', { reason });
                    }} title="رفض"><X size={16} /></button>
                  </>
                )}
                {f.canManage && <button className="btn btn-ghost p-2" style={{ color: '#ff9b94' }} onClick={() => del(f)} title="حذف"><Trash2 size={16} /></button>}
                {f.uploader.id !== null && !f.canManage && (
                  <ReportButton onReport={(reason) => report(f.id, reason)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* الصور */}
      {subject && (
      <div className="mt-10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2"><ImageIcon size={18} /> الصور</h2>
            <p className="text-xs text-[var(--muted)]">صور المقياس — تُفحص آليًا وتُمرر عبر مراجعة المشرف قبل النشر</p>
          </div>
        </div>

        {images.length === 0 ? (
          <Empty title="لا توجد صور بعد" hint="اضغط «إضافة» بالأعلى ثم «إضافة صورة»" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((f) => (
              <div key={f.id} className="card overflow-hidden fade-up">
                {f.status === 'PUBLISHED' ? (
                  <button className="block w-full" onClick={() => setViewId(f.id)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/files/${f.id}/content`} alt={f.title} className="w-full h-32 object-cover" />
                  </button>
                ) : (
                  <div className="w-full h-32 flex flex-col items-center justify-center gap-1" style={{ background: 'rgba(15,12,5,.05)' }}>
                    <StatusPill status={f.status} />
                    {f.status === 'REJECTED' && f.rejectReason && (
                      <span className="text-[10px] text-[#ff9b94] px-2 text-center">{f.rejectReason}</span>
                    )}
                  </div>
                )}
                <div className="p-2.5">
                  <div className="text-xs font-bold line-clamp-1">{f.title}</div>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <span className="text-[10px] text-[var(--muted)]">{f.uploader.firstName} {f.uploader.lastName}</span>
                    <div className="flex items-center gap-1">
                      {f.status === 'PUBLISHED' && (
                        <a className="btn btn-ghost p-1.5" href={`/api/files/${f.id}/download`} title="تحميل"><Download size={13} /></a>
                      )}
                      {isSup && (f.status === 'PENDING' || f.status === 'REJECTED') && (
                        <>
                          <button className="btn btn-ghost p-1.5" style={{ color: 'var(--ok)' }} onClick={() => act(f.id, 'approve')} title="نشر"><Check size={13} /></button>
                          <button className="btn btn-ghost p-1.5" style={{ color: '#ff9b94' }} onClick={() => {
                            const reason = window.prompt('سبب الرفض:', 'محتوى غير مناسب');
                            if (reason !== null) act(f.id, 'reject', { reason });
                          }} title="رفض"><X size={13} /></button>
                        </>
                      )}
                      {f.canManage && <button className="btn btn-ghost p-1.5" style={{ color: '#ff9b94' }} onClick={() => del(f)} title="حذف"><Trash2 size={13} /></button>}
                      {!f.canManage && <ReportButton onReport={(reason) => report(f.id, reason)} />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* واجهة إضافة */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="أضف إلى المقياس">
        <p className="text-sm text-[var(--muted)] mb-4">اختر نوع المحتوى وسيفتح لك مباشرة نافذة اختيار الملف:</p>
        {error && <div className="text-sm mb-3 text-[#ff9b94]">{error}</div>}
        {busy ? (
          <div className="py-8 flex justify-center"><Spinner size={26} /></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer rounded-xl border-2 border-dashed border-[var(--line)] p-5 text-center transition-colors hover:border-[var(--gold)]">
              <input
                type="file"
                className="hidden"
                accept="application/pdf,text/plain,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  e.target.value = '';
                  if (f) doUpload(f, false);
                }}
              />
              <Paperclip size={26} className="mx-auto mb-2" style={{ color: 'var(--gold)' }} />
              <div className="text-sm font-black">إدراج ملف</div>
              <div className="text-[11px] text-[var(--muted)] mt-1">PDF، Word، Excel، PowerPoint، مضغوط…</div>
            </label>
            <label className="cursor-pointer rounded-xl border-2 border-dashed border-[var(--line)] p-5 text-center transition-colors hover:border-[var(--gold)]">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  e.target.value = '';
                  if (f) doUpload(f, true);
                }}
              />
              <ImageIcon size={26} className="mx-auto mb-2" style={{ color: 'var(--gold)' }} />
              <div className="text-sm font-black">إضافة صورة</div>
              <div className="text-[11px] text-[var(--muted)] mt-1">PNG، JPG، WebP، GIF — تُفحص آليًا</div>
            </label>
          </div>
        )}
      </Modal>

      {/* معاينة */}
      <Modal open={Boolean(viewFile)} onClose={() => setViewId(null)} title={viewFile?.title || ''}>
        {viewFile && (
          <div>
            {isImage(viewFile.mimeType) && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={`/api/files/${viewFile.id}/content`} alt={viewFile.title} className="rounded-xl w-full max-h-96 object-contain" style={{ background: 'rgba(0,0,0,.3)' }} />
            )}
            {isPdf(viewFile.mimeType) && (
              <iframe src={`/api/files/${viewFile.id}/content`} className="w-full h-[60vh] rounded-xl" style={{ background: '#fff' }} />
            )}
            {!isImage(viewFile.mimeType) && !isPdf(viewFile.mimeType) && (
              <div className="text-center py-6">
                <div className="text-sm text-[var(--muted)] mb-4">لا يمكن عرض هذا النوع داخل الصفحة</div>
                <a className="btn btn-gold" href={`/api/files/${viewFile.id}/download`}><Download size={16} /> تحميل الملف</a>
              </div>
            )}
            <a className="btn w-full mt-3 justify-center" href={`/api/files/${viewFile.id}/download`}><Download size={16} /> تحميل الملف</a>
          </div>
        )}
      </Modal>
    </div>
  );
}