'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Check } from 'lucide-react';
import { Spinner } from '@/components/ui';
import NextArrow from '@/components/NextArrow';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const steps = ['بياناتك', 'رمز التحقق', 'أنت جاهز'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [testCode, setTestCode] = useState('');
  const [started, setStarted] = useState(false);
  const [copied, setCopied] = useState<'email' | 'code' | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());

  const next = () => {
    if (!started) return setStarted(true);
    if (step === 0) return setStep(1);
    if (step === 1) return setStep(2);
    if (step === 2) return router.push('/onboarding');
  };

  const copy = async (what: 'email' | 'code') => {
    try {
      await navigator.clipboard.writeText(what === 'email' ? email.trim() : testCode);
      setCopied(what);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* تجاهل */
    }
  };

  /** الخطوة الأولى: حفظ البيانات ثم إرسال الرمز إلى البريد */
  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setError('اكتب بريدك الإلكتروني الجامعي أولًا (مثال: you@example.dz)');
      return;
    }
    setBusy(true); setError(''); setOkMsg('');
    try {
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

      if (d2.testCode) setTestCode(d2.testCode);
      setStep(1);
    } finally { setBusy(false); }
  };

  const resend = async () => {
    setBusy(true); setError(''); setOkMsg('');
    try {
      const res = await fetch('/api/auth/register/resend', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (data.testCode) setTestCode(data.testCode);
      setOkMsg('أُعيد إرسال الرمز إلى بريدك');
    } finally { setBusy(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setOkMsg('');
    try {
      const res = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep(2);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" dir="rtl">
      <div className="mb-8 text-center fade-up">
        <h1 className="text-2xl font-black mt-4">{started ? 'أنشئ حسابك' : 'أهلًا بك في EDU PRO'}</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {started ? 'بضع خطوات وتدخل فوجك الرقمي' : 'فوجك الجامعي الرقمي — مقيّسات، واجبات، جدول ودردشة'}
        </p>
      </div>

      {/* ===== شاشة البداية قبل التسجيل ===== */}
      {!started && (
        <div className="card w-full max-w-sm p-7 text-center fade-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg,#e8c87a,#b8934a)', color: '#13140f' }}>🎓</div>
          <h2 className="text-xl font-black">ابدأ رحلتك الجامعية</h2>
          <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
            أنشئ حسابك، اختر ولايتك وجامعتك، وادخل فوجك:
            حمّل المقيّسات، سلّم الواجبات، تابِع الجدول وتواصل مع زملائك.
          </p>
          <button type="button" className="btn btn-gold w-full mt-5 py-3" onClick={() => setStarted(true)}>
            ابدأ التسجيل الآن
          </button>
          <p className="text-sm text-[var(--muted)] mt-5">
            لديك حساب؟{' '}
            <Link href="/login" className="font-bold" style={{ color: 'var(--gold)' }}>سجل الدخول</Link>
          </p>
        </div>
      )}

      {/* مؤشر الخطوات */}
      {started && (
        <div className="flex items-center gap-2.5 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full transition-all ${i <= step ? '' : 'opacity-30'}`}
                style={{ background: i <= step ? 'linear-gradient(135deg,#e8c87a,#b8934a)' : 'rgba(15,12,5,.12)' }} />
              {i < steps.length - 1 && <span className="w-7 h-px bg-[var(--line)]" />}
            </div>
          ))}
          <span className="text-xs font-bold mr-1" style={{ color: 'var(--gold)' }}>{steps[step]}</span>
        </div>
      )}

      {/* ===== الخطوة 1: البيانات + البريد ===== */}
      {started && step === 0 && (
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

          <button type="submit" className="btn btn-gold w-full mt-5 py-2.5" disabled={busy}>
            {busy ? <Spinner /> : 'إرسال رمز التحقق'}
          </button>

          {error && <div className="text-sm mt-3 rounded-xl p-3" style={{ background: 'rgba(228,87,87,.12)', color: '#ff9b94' }}>{error}</div>}
        </form>
      )}

      {/* ===== الخطوة 2: رمز التحقق ===== */}
      {started && step === 1 && (
        <form onSubmit={verify} className="card w-full max-w-sm p-6 fade-up">
          <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(201,169,98,.1)', border: '1px solid rgba(201,169,98,.35)' }}>
            رمز التحقق الخاص بك (وضع تجريبي — لا يُرسل بريد فعلي)
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="font-bold break-all" style={{ color: 'var(--gold)' }} dir="ltr">{email}</div>
              <button type="button" onClick={() => copy('email')} className="btn btn-ghost p-1.5 shrink-0"
                title="نسخ البريد">
                {copied === 'email' ? <Check size={15} style={{ color: 'var(--ok)' }} /> : <Copy size={15} style={{ color: 'var(--gold)' }} />}
              </button>
            </div>
          </div>

          <label className="label mt-5">أدخل رمز التحقق (6 أرقام)</label>
          <input className="input text-center tracking-[0.4em] font-bold text-lg" dir="ltr"
            value={code} maxLength={6} inputMode="numeric" autoFocus
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />

          {testCode && (
            <div className="mt-3 rounded-xl p-3 text-center font-bold" style={{ background: 'rgba(201,169,98,.1)', border: '1px dashed rgba(201,169,98,.4)' }}>
              <div className="flex items-center justify-center gap-2">
                <button type="button" className="text-2xl font-black tracking-[0.3em]" style={{ color: 'var(--gold-2)' }}
                  onClick={() => setCode(testCode)}>
                  {testCode}
                </button>
                <button type="button" onClick={() => copy('code')} className="btn btn-ghost p-1.5 shrink-0"
                  title="نسخ الرمز">
                  {copied === 'code' ? <Check size={15} style={{ color: 'var(--ok)' }} /> : <Copy size={15} style={{ color: 'var(--gold)' }} />}
                </button>
              </div>
              <div className="text-[11px] text-[var(--muted)] mt-1">اضغط الرمز لإدخاله، أو انسخه</div>
            </div>
          )}

          {okMsg && <div className="text-xs mt-2" style={{ color: 'var(--ok)' }}>{okMsg}</div>}

          <div className="flex gap-2 mt-4">
            <button type="button" className="btn btn-ghost flex-1 text-sm" onClick={resend} disabled={busy}>
              إعادة الإرسال
            </button>
            <button type="submit" className="btn btn-gold flex-1 py-2.5" disabled={busy || code.length !== 6}>
              {busy ? <Spinner /> : 'تحقق'}
            </button>
          </div>

          {error && <div className="text-sm mt-3 rounded-xl p-3" style={{ background: 'rgba(228,87,87,.12)', color: '#ff9b94' }}>{error}</div>}
        </form>
      )}

      {/* ===== الخطوة 3: تم ===== */}
      {started && step === 2 && (
        <div className="card w-full max-w-sm p-6 text-center fade-up">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-black" style={{ color: 'var(--gold)' }}>تم التحقق بنجاح!</h2>
          <p className="text-sm text-[var(--muted)] mt-2">خطوة واحدة متبقية: تحديد فوجك الجامعي.</p>
          <button type="button" className="btn btn-gold w-full mt-5 py-3" onClick={() => router.push('/onboarding')}>
            تحديد الفوج
          </button>
        </div>
      )}

      {started && (
        <p className="text-sm text-[var(--muted)] mt-5">
          لديك حساب؟{' '}
          <Link href="/login" className="font-bold" style={{ color: 'var(--gold)' }}>سجل الدخول</Link>
        </p>
      )}

      {/* السهم العائم للتفويت — ينتقل دون ملء البيانات */}
      <NextArrow onClick={next} disabled={busy} />
    </div>
  );
}