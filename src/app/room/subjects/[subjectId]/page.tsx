'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Paperclip, Eye, Download, Trash2, Check, X, FileUp } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/client';
import { Spinner, Empty, Modal, FileTypeIcon, StatusPill, TimeAgo, ReportButton } from '@/components/ui';

type Subject = { id: string; name: string; icon: string; color: string };
type FileItem = {
  id: string; title: string; category: string; status: string; rejectReason: string | null;
  fileName: string; sizeBytes: number; mimeType: string; extLabel: string; createdAt: string;
  uploader: { id: string; firstName: string; lastName: string };
  canManage: boolean;
};

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

  const fileRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isSup, setIsSup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);

  const load = async () => {
    const [room, subj] = await Promise.all([
      apiGet<{ isSupervisor: boolean }>('/api/room'),
      apiGet<{ subjects: Subject[] }>('/api/subjects'),
    ]);
    const sup = room.ok && room.data.isSupervisor;
    setIsSup(sup);
    let found = subj.ok ? subj.data.subjects.find((s) => s.id === subjectId) || null : null;
    if (!found) {
      const one = await apiGet<{ subject: Subject }>(`/api/subjects/${subjectId}`);
      if (one.ok) found = one.data.subject;
    }
    setSubject(found);

    if (found) {
      const q = new URLSearchParams({ subjectId });
      if (sup) q.set('pending', '1');
      const r = await apiGet<{ files: FileItem[] }>(`/api/files?${q}`);
      if (r.ok) setFiles(r.data.files);
    }
    setLoading(false);
  };

  useEffect(() => {
    const hasUpload = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('upload') === '1';
    load();
    if (hasUpload && fileRef.current) fileRef.current.click();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const doUpload = async (file: File) => {
    setBusy(true); setError('');
    const fd = new FormData();
    fd.set('title', file.name.replace(/\.[^.]+$/, '') || file.name);
    fd.set('category', 'FILE');
    fd.set('subjectId', subject ? subject.id : '');
    fd.set('file', file);
    const r = await apiPost('/api/files', fd);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setError('');
    load();
  };

  const act = async (id: string, action: string, extra?: object) => {
    const r = await apiPatch(`/api/files/${id}/status`, { action, ...extra });
    if (r.ok) load();
  };

  const del = async (file: FileItem) => {
    if (!confirm(`حذف «${file.title}»؟`)) return;
    await apiPatch(`/api/files/${file.id}`, { action: 'delete' });
    load();
  };

  const report = async (id: string, reason: string) => {
    await apiPost('/api/reports', { type: 'FILE', targetId: id, reason });
    alert('تم إرسال البلاغ.');
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size={28} /></div>;

  const viewFile = files.find((f) => f.id === viewId) || null;
  const isImage = (mime: string) => mime.startsWith('image/');
  const isPdf = (mime: string) => mime === 'application/pdf';

  const uploadBox = subject ? (
    <input
      ref={fileRef}
      type="file"
      className="hidden"
      accept="application/pdf,text/plain,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,image/*"
      onChange={(e) => {
        const f = e.target.files?.[0] || null;
        e.target.value = '';
        if (f) doUpload(f);
      }}
    />
  ) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {subject ? (
        <>
          <div className="breadcrumb mb-1">
            <Link href="/room">غرفتي</Link><span className="sep">›</span>
            <Link href="/room/subjects">المقاييس</Link><span className="sep">›</span>
            <span className="current">{subject.name}</span>
          </div>

          <div className="card p-6 mb-6 fade-up relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(500px 180px at 85% 0%, ${subject.color}22, transparent 60%)` }} />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{ICON_LABEL[subject.icon] || '📄'}</div>
                <div>
                  <h1 className="text-2xl font-black">{subject.name}</h1>
                  <p className="text-sm text-[var(--muted)]">أضف ملفك الدراسي وسيظهر هنا مع ملفات الفوج</p>
                </div>
              </div>
              <button className="btn btn-gold" disabled={busy} onClick={() => fileRef.current?.click()}>
                {busy ? <Spinner /> : <FileUp size={16} />} إدراج ملف
              </button>
            </div>
          </div>
          {uploadBox}

          {error && <div className="text-sm mb-3 text-[#ff9b94]">{error}</div>}

          <h2 className="text-lg font-black flex items-center gap-2 mb-3"><Paperclip size={18} /> جميع الملفات ({files.length})</h2>

          {files.length === 0 ? (
            <button className="w-full card border-2 border-dashed p-10 text-center hover:opacity-80" onClick={() => fileRef.current?.click()}>
              <FileUp size={30} className="mx-auto mb-3" style={{ color: 'var(--gold)' }} />
              <div className="font-black">لا توجد ملفات بعد</div>
              <div className="text-sm text-[var(--muted)] mt-1">انقر هنا لإدراج ملفك الدراسي (صورة أو ملف)</div>
            </button>
          ) : (
            <div className="rounded-2xl border border-[var(--line)] overflow-hidden">
              {files.map((f, i) => (
                <div key={f.id} className={`flex items-center gap-3 p-3.5 ${i > 0 ? 'border-t border-[var(--line)]' : ''} fade-up`}>
                  {isImage(f.mimeType) && f.status === 'PUBLISHED' ? (
                    <button onClick={() => setViewId(f.id)} className="shrink-0 rounded-xl overflow-hidden w-14 h-14 border border-[var(--line)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/files/${f.id}/content`} alt={f.title} className="w-14 h-14 object-cover" />
                    </button>
                  ) : (
                    <FileTypeIcon mimeType={f.mimeType} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{f.title}</span>
                      <StatusPill status={f.status} />
                      {f.status === 'REJECTED' && f.rejectReason && (
                        <span className="text-[11px] text-[#ff9b94]">— {f.rejectReason}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--muted)]">
                      <span>{f.uploader.firstName} {f.uploader.lastName}</span>
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
                    {!f.canManage && <ReportButton onReport={(reason) => report(f.id, reason)} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Empty title="المقياس غير متوفر" hint="تأكد من تسجيل الدخول بحسابك الصحيح وافتح المقياس من صفحة المقاييس" />
          <div className="text-center mt-3"><Link className="btn btn-gold" href="/room/subjects">العودة إلى المقاييس</Link></div>
        </>
      )}

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