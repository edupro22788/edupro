'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Spinner, Empty } from '@/components/ui';
import { apiGet, apiPost } from '@/lib/client';
import NextArrow from '@/components/NextArrow';

type Item = { id: string; name: string; members?: number };

type StepKey = 'state' | 'university' | 'faculty' | 'major' | 'level' | 'group';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>('state');
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [states, setStates] = useState<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [newGroup, setNewGroup] = useState('');

  const order: StepKey[] = ['state', 'university', 'faculty', 'major', 'level', 'group'];
  const labels: Record<StepKey, string> = {
    state: 'الولاية', university: 'الجامعة', faculty: 'الكلية', major: 'التخصص', level: 'المستوى', group: 'الفوج',
  };

  useEffect(() => {
    (async () => {
      const me = await (await fetch('/api/auth/me', { cache: 'no-store' })).json();
      if (!me.user) { router.replace('/login'); return; }
      if (!me.user.emailVerified) { router.replace('/verify'); return; }
      if (me.group) { router.replace('/room'); return; }
      const r = await apiGet<{ states: Item[] }>('/api/states');
      if (r.ok) setStates(r.data.states);
      setChecking(false);
    })();
  }, [router]);

  const pick2 = async (id: string) => {
    const key = order[order.indexOf(step)];
    setSel((s) => ({ ...s, [key]: id }));
    setError('');
    const nextIdx = order.indexOf(step) + 1;
    if (nextIdx >= order.length) return;

    const next = order[nextIdx];
    const endpointMap: Record<string, string> = {
      university: `/api/universities?stateId=${id}`,
      faculty: `/api/faculties?universityId=${id}`,
      major: `/api/majors?facultyId=${id}`,
      level: `/api/levels?majorId=${id}`,
      group: `/api/groups?levelId=${id}`,
    };
    const res = await apiGet<{ [k: string]: Item[] }>(endpointMap[next]);
    if (res.ok) {
      setItems(res.data[next + 's'] || []);
    } else {
      setItems([]);
    }
    setStep(next);
    setNewGroup('');
  };

  const complete = async () => {
    setBusy(true); setError('');
    let body: Record<string, string> = {};
    const levelId = sel.level;
    if (sel.group) {
      body = { groupId: sel.group };
    } else {
      body = { studyLevelId: levelId, newGroupName: (newGroup || 'الفوج 01').trim() };
    }
    const r = await apiPost('/api/register/complete', body);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    router.push('/room');
    router.refresh();
  };

  const back = () => {
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const canNext = order.indexOf(step) < order.length - 1;
  const advance = () => {
    const i = order.indexOf(step);
    if (i >= order.length - 1) return;
    setItems([]);
    setNewGroup('');
    setStep(order[i + 1]);
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center"><Spinner size={26} /></div>;

  const isGroupStep = step === 'group';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" dir="rtl">
      <div className="mb-8 text-center fade-up">
        <h1 className="text-2xl font-black mt-4">اختر فوجك</h1>
        <p className="text-sm text-[var(--muted)] mt-1">الولاية ثم الجامعة وصولًا إلى الفوج</p>

        {/* السلسلة المختارة */}
        {Object.keys(sel).length > 0 && (
          <div className="breadcrumb mt-4 justify-center gap-2 max-w-md mx-auto">
            {order.filter((k) => sel[k]).map((k, i) => (
              <span key={k} className="inline-flex items-center gap-2">
                {i > 0 && <span className="sep">›</span>}
                <span>{sel[k]}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card w-full max-w-sm p-6 fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">الخطوة: {labels[step]}</h2>
          {step !== 'state' && (
            <button className="btn btn-ghost text-sm px-3 py-1.5" onClick={back}>السابق</button>
          )}
        </div>

        {step === 'state' ? (
          <div className="max-h-72 overflow-y-auto grid grid-cols-2 gap-2">
            {states.map((s) => (
              <button key={s.id} className="btn justify-between text-sm" onClick={() => pick2(s.id)}>
                {s.name}
                {!isGroupStep && <ChevronRight size={14} className="opacity-40" />}
              </button>
            ))}
          </div>
        ) : (
          <>
            {items.length === 0 ? (
              <Empty title="لا توجد عناصر بعد" hint="يمكنك إدارة البنية من لوحة الإدارة" />
            ) : (
              <div className="max-h-72 overflow-y-auto grid gap-2">
                {items.map((it) => (
                  <button key={it.id} className="btn justify-between text-sm text-right" onClick={() => pick2(it.id)}>
                    {it.name}
                    {typeof it.members === 'number' && (
                      <span className="text-xs text-[var(--muted)]">{it.members} عضو</span>
                    )}
                    {!isGroupStep && <ChevronRight size={14} className="opacity-40" />}
                  </button>
                ))}
              </div>
            )}

            {isGroupStep && (
              <>
                <div className="my-3 text-center text-xs text-[var(--muted)]">أو أنشئ فوجًا جديدًا</div>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="اسم الفوج الجديد (مثال: الفوج 04)"
                    value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
                  <button className="btn btn-gold" disabled={busy} onClick={complete}>
                    {busy ? <Spinner /> : 'انضم'}
                  </button>
                </div>
                {error && <div className="text-sm mt-3 rounded-xl p-3" style={{ background: 'rgba(228,87,87,.12)', color: '#ff9b94' }}>{error}</div>}
                <p className="text-[11px] text-[var(--muted)] mt-3 leading-relaxed">
                  انضم إلى فوج موجود لتظهر معلوماته وأعضاؤه، أو أنشئ فوجًا جديدًا وستكون بداية مجموعة جديدة.
                </p>
              </>
            )}
          </>
        )}
      </div>
    <NextArrow onClick={advance} disabled={!canNext} />
    </div>
  );
}