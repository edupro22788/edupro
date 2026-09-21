'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'تعذر تسجيل الدخول');
        return;
      }
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (!data.user.hasGroup) {
        router.push('/onboarding');
      } else {
        router.push('/room');
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" dir="rtl">
      <div className="mb-8 text-center fade-up">
        <h1 className="text-2xl font-black mt-4">تسجيل الدخول</h1>
        <p className="text-sm text-[var(--muted)] mt-1">أهلاً بعودتك إلى فوجك</p>
      </div>

      <form onSubmit={submit} className="card w-full max-w-sm p-6 fade-up">
        <label className="label">البريد الإلكتروني</label>
        <input
          className="input mb-4" type="email" value={email} dir="ltr" required
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.dz"
        />
        <label className="label">كلمة المرور</label>
        <input
          className="input mb-4" type="password" value={password} dir="ltr" required
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
        />

        {error && <div className="text-sm mb-4 rounded-xl p-3" style={{ background: 'rgba(228,87,87,.12)', color: '#ff9b94' }}>{error}</div>}

        <button className="btn btn-gold w-full py-3" disabled={busy}>
          {busy ? <Spinner /> : 'دخول'}
        </button>
      </form>

      <p className="text-sm text-[var(--muted)] mt-5">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-bold" style={{ color: 'var(--gold)' }}>
          أنشئ حسابك الآن
        </Link>
      </p>
      <Link href="/" className="text-xs text-[var(--muted)]/60 mt-2">العودة إلى الرئيسية</Link>
    </div>
  );
}