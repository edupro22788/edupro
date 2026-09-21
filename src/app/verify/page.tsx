'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check } from 'lucide-react';
import { Spinner } from '@/components/ui';
import NextArrow from '@/components/NextArrow';

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [testCode, setTestCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(testCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* تجاهل */
    }
  };

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const d = await res.json();
      if (!d.user) { router.replace('/login'); return; }
      if (d.user.emailVerified) { router.replace('/room'); return; }
      setLoading(false);
      const r = await fetch('/api/auth/register/resend', { method: 'POST' });
      const v = await r.json();
      if (v.testCode) setTestCode(v.testCode);
    })();
  }, [router]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/auth/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setError(d.error); return; }
    const me = await (await fetch('/api/auth/me')).json();
    if (me.user?.role === 'ADMIN') router.push('/admin');
    else if (me.group) router.push('/room');
    else router.push('/onboarding');
    router.refresh();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={26} /></div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" dir="rtl">
      <div className="mb-8 text-center fade-up">
        <h1 className="text-2xl font-black mt-4">تأكيد بريدك الإلكتروني</h1>
        <p className="text-sm text-[var(--muted)] mt-1">أدخل الرمز المرسل إلى بريدك</p>
      </div>

      <form ref={formRef} onSubmit={verify} className="card w-full max-w-sm p-6 fade-up">
        <input className="input text-center tracking-[0.4em] font-bold text-lg" dir="ltr"
          value={code} maxLength={6} inputMode="numeric"
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />

        {testCode && (
          <div className="mt-4 rounded-xl p-3 text-center" style={{ background: 'rgba(201,169,98,.1)', border: '1px dashed rgba(201,169,98,.4)' }}>
            <div className="text-xs text-[var(--muted)] mb-1">وضع تجريبي — رمزك الحالي:</div>
            <button type="button" className="text-2xl font-black tracking-[0.3em]" style={{ color: 'var(--gold-2)' }} onClick={() => setCode(testCode)}>
              {testCode}
            </button>
          </div>
        )}

        {error && <div className="text-sm mt-3 rounded-xl p-3" style={{ background: 'rgba(228,87,87,.12)', color: '#ff9b94' }}>{error}</div>}

        <button className="btn btn-gold w-full mt-4 py-2.5" disabled={busy || code.length !== 6}>
          {busy ? <Spinner /> : 'تحقق'}
        </button>
      </form>

      <NextArrow onClick={() => code.length === 6 && formRef.current?.requestSubmit()} disabled={code.length !== 6} />
    </div>
  );
}