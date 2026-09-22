'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEVELS = ['ليسانس 1', 'ليسانس 2', 'ليسانس 3', 'ماستر 1', 'ماستر 2'];

type Item = { id: string; name: string; members?: number; levelId?: string };
type Step = 'data' | 'institution' | 'level' | 'branch' | 'group';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('data');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // البيانات الشخصية
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // المؤسسة
  const [states, setStates] = useState<Item[]>([]);
  const [universities, setUniversities] = useState<Item[]>([]);
  const [faculties, setFaculties] = useState<Item[]>([]);
  const [stateId, setStateId] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [facultyId, setFacultyId] = useState('');

  // المستوى
  const [levelName, setLevelName] = useState('');

  // الفرع
  const [majors, setMajors] = useState<Item[]>([]);
  const [majorId, setMajorId] = useState('');

  // الفوج
  const [studyLevelId, setStudyLevelId] = useState('');
  const [groups, setGroups] = useState<Item[]>([]);
  const [groupId, setGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  const [createdEmail, setCreatedEmail] = useState('');

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/states');
      const d = await r.json();
      if (d.states) setStates(d.states);
    })();
  }, []);

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) { setError('أدخل الاسم الأول والاسم الأخير'); return; }
    if (!EMAIL_RE.test(email.trim())) { setError('اكتب بريدًا إلكترونيًا صحيحًا (مثال: you@example.dz)'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return; }

    setBusy(true);
    try {
      if (createdEmail !== email.trim()) {
        const r1 = await fetch('/api/auth/register/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, password }),
        });
        const d1 = await r1.json();
        if (!r1.ok) { setError(d1.error); return; }

        const r2 = await fetch('/api/auth/register/step2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const d2 = await r2.json();
        if (!r2.ok) { setError(d2.error); return; }
        setCreatedEmail(email.trim());
      }
      setStep('institution');
    } finally { setBusy(false); }
  };

  const pickState = async (id: string) => {
    setStateId(id); setUniversityId(''); setFacultyId('');
    setUniversities([]); setFaculties([]);
    const r = await fetch(`/api/universities?stateId=${id}`);
    const d = await r.json();
    if (d.universities) setUniversities(d.universities);
  };

  const pickUniversity = async (id: string) => {
    setUniversityId(id); setFacultyId('');
    setFaculties([]);
    const r = await fetch(`/api/faculties?universityId=${id}`);
    const d = await r.json();
    if (d.faculties) setFaculties(d.faculties);
  };

  const goBranch = async () => {
    setBusy(true); setError('');
    setMajorId(''); setStudyLevelId(''); setGroups([]); setGroupId(''); setNewGroupName('');
    try {
      const r = await fetch(`/api/majors?facultyId=${facultyId}&levelName=${encodeURIComponent(levelName)}`);
      const d = await r.json();
      setMajors(d.majors || []);
      setStep('branch');
    } finally { setBusy(false); }
  };

  const pickBranch = async (id: string) => {
    setMajorId(id); setStudyLevelId(''); setGroups([]); setGroupId(''); setNewGroupName(''); setError('');
    if (!id) return;
    const m = majors.find((x) => x.id === id);
    if (!m?.levelId) { setError('هذا الفرع غير متاح في المستوى المختار'); return; }
    setStudyLevelId(m.levelId);
    const g = await fetch(`/api/groups?levelId=${m.levelId}`);
    const gd = await g.json();
    setGroups(gd.groups || []);
  };

  const complete = async () => {
    setBusy(true); setError('');
    const body: Record<string, string> = groupId
      ? { groupId }
      : { studyLevelId, newGroupName: (newGroupName || 'الفوج 01').trim() };
    try {
      const r = await fetch('/api/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      router.push('/room?reserved=1');
      router.refresh();
    } finally { setBusy(false); }
  };

  const back = () => {
    if (step === 'institution') setStep('data');
    else if (step === 'level') setStep('institution');
    else if (step === 'branch') setStep('level');
    else if (step === 'group') setStep('branch');
  };

  const STEPS: Step[] = ['data', 'institution', 'level', 'branch', 'group'];
  const stepsLabel: Record<Step, string> = {
    data: 'بياناتك',
    institution: 'مؤسستك',
    level: 'مستواك',
    branch: 'فرعك',
    group: 'فوجك',
  };

  const goldStyle = { border: '1px solid var(--gold)', background: 'rgba(201,169,98,.12)', color: 'var(--gold)' };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      dir="rtl"
      style={{
        backgroundImage: "linear-gradient(rgba(58,36,71,.82), rgba(58,36,71,.9)), url('/university.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="mb-8 text-center fade-up">
        <h1 className="text-2xl font-black mt-4">أنشئ حسابك</h1>
        <p className="text-sm text-[var(--muted)] mt-1">بضع خطوات وتدخل فوجك الجامعي الرقمي</p>

        <div className="flex items-center justify-center gap-2 mt-5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full transition-all ${s === step ? '' : 'opacity-30'}`}
                style={{ background: s === step ? 'linear-gradient(135deg,#e8c87a,#b8934a)' : 'rgba(15,12,5,.12)' }} />
              {i < STEPS.length - 1 && <span className="w-5 h-px bg-[var(--line)]" />}
            </div>
          ))}
          <span className="text-xs font-bold mr-1" style={{ color: 'var(--gold)' }}>{stepsLabel[step]}</span>
        </div>
      </div>

      {error && <div className="text-sm mb-4 rounded-xl p-3 w-full max-w-sm" style={{ background: 'rgba(228,87,87,.12)', color: '#ff9b94' }}>{error}</div>}

      {step === 'data' && (
        <form onSubmit={submitData} className="card w-full max-w-sm p-6 fade-up">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">الاسم الأول</label>
              <input className="input" value={firstName} required onChange={(e) => setFirstName(e.target.value)} placeholder="أحمد" />
            </div>
            <div>
              <label className="label">الاسم الأخير</label>
              <input className="input" value={lastName} required onChange={(e) => setLastName(e.target.value)} placeholder="بن علي" />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">البريد الإلكتروني</label>
            <input className="input" type="email" dir="ltr" value={email} required
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.dz" />
          </div>
          <div className="mt-4">
            <label className="label">كلمة المرور (6 أحرف على الأقل)</label>
            <input className="input" type="password" dir="ltr" value={password} required minLength={6}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="mt-4">
            <label className="label">تأكيد كلمة المرور</label>
            <input className="input" type="password" dir="ltr" value={confirm} required
              onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" className="btn btn-gold w-full mt-5 py-2.5" disabled={busy}>
            {busy ? <Spinner /> : 'متابعة'}
          </button>
        </form>
      )}

      {step === 'institution' && (
        <div className="card w-full max-w-sm p-6 fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">مؤسستك التعليمية</h2>
            <button className="btn btn-ghost text-sm px-3 py-1.5" onClick={back}>السابق</button>
          </div>

          <label className="label">الولاية</label>
          <select className="input mb-4" value={stateId} onChange={(e) => pickState(e.target.value)}>
            <option value="">اختر الولاية…</option>
            {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {stateId && (
            <>
              <label className="label">الجامعة</label>
              <select className="input mb-4" value={universityId} onChange={(e) => pickUniversity(e.target.value)}>
                <option value="">اختر الجامعة…</option>
                {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </>
          )}

          {universityId && (
            <>
              <label className="label">الكلية</label>
              <select className="input mb-4" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                <option value="">اختر الكلية…</option>
                {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </>
          )}

          <button className="btn btn-gold w-full mt-2 py-2.5" disabled={!facultyId || busy} onClick={goBranch}>
            متابعة إلى المستوى
          </button>
        </div>
      )}

      {step === 'level' && (
        <div className="card w-full max-w-sm p-6 fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">مستواك الدراسي</h2>
            <button className="btn btn-ghost text-sm px-3 py-1.5" onClick={back}>السابق</button>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">اختر مستواك، ثم اختر الفرع المناسب.</p>

          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map((l) => (
              <button key={l} type="button" className="btn text-sm"
                style={levelName === l ? goldStyle : {}}
                onClick={() => setLevelName(l)}>
                {l}
              </button>
            ))}
          </div>

          <button className="btn btn-gold w-full mt-5 py-2.5" disabled={!levelName || busy} onClick={goBranch}>
            متابعة إلى الفرع
          </button>
        </div>
      )}

      {step === 'branch' && (
        <div className="card w-full max-w-sm p-6 fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">فرعك / تخصصك</h2>
            <button className="btn btn-ghost text-sm px-3 py-1.5" onClick={back}>السابق</button>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">فروع الكلية المتاحة لمستوى «{levelName}».</p>

          <select className="input" value={majorId} onChange={(e) => pickBranch(e.target.value)}>
            <option value="">اختر الفرع…</option>
            {majors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <button className="btn btn-gold w-full mt-5 py-2.5" disabled={!studyLevelId} onClick={() => setStep('group')}>
            متابعة إلى الفوج
          </button>
        </div>
      )}

      {step === 'group' && (
        <div className="card w-full max-w-sm p-6 fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">فوجك</h2>
            <button className="btn btn-ghost text-sm px-3 py-1.5" onClick={back}>السابق</button>
          </div>

          {groups.length > 0 && (
            <>
              <div className="mb-2 text-xs text-[var(--muted)]">اختر فوجك الموجود</div>
              <div className="grid gap-2 max-h-52 overflow-y-auto">
                {groups.map((g) => (
                  <button key={g.id} type="button"
                    className="btn justify-between text-sm text-right"
                    style={groupId === g.id ? goldStyle : {}}
                    onClick={() => { setGroupId(g.id); setNewGroupName(''); }}>
                    <span>{g.name}</span>
                    <span className="text-xs text-[var(--muted)]">{g.members} عضو</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="my-4 text-center text-xs text-[var(--muted)]">أو أنشئ فوجًا جديدًا</div>
          <input className="input w-full" placeholder="اسم الفوج الجديد (مثال: الفوج 03)"
            value={groupId ? '' : newGroupName} onChange={(e) => { setGroupId(''); setNewGroupName(e.target.value); }} />

          <button className="btn btn-gold w-full mt-5 py-3 text-lg"
            disabled={busy || (!groupId && !newGroupName.trim())}
            onClick={complete}>
            {busy ? <Spinner /> : 'ادخل القاعة'}
          </button>
        </div>
      )}

      <p className="text-sm text-[var(--muted)] mt-5">
        لديك حساب؟{' '}
        <Link href="/login" className="font-bold" style={{ color: 'var(--gold)' }}>سجل الدخول</Link>
      </p>
      <Link href="/" className="text-xs text-[var(--muted)]/60 mt-2">العودة إلى الرئيسية</Link>

      <p className="text-[10px] text-[var(--muted)]/40 mt-3 text-center">
        صورة الخلفية: «منظر لجامعة الإخوة منتوري» — Youcefabdarhman، رخصة{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline">
          CC BY 4.0
        </a>
      </p>
    </div>
  );
}
