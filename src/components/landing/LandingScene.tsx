'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

type Phase = 'idle' | 'action' | 'leaving';

function buildLamp(scene: THREE.Scene) {
  const group = new THREE.Group();

  const gold = new THREE.MeshStandardMaterial({
    color: 0xd4af37, roughness: 0.35, metalness: 0.85, emissive: 0x8a6d1f, emissiveIntensity: 0.6,
  });

  // مصباح معدني (مثلث مقلوب)
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.42, 4), gold);
  shade.rotation.y = Math.PI / 4;
  shade.position.y = 2.95;

  // خيط التعليق
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.3, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a3e52, roughness: 0.8 }),
  );
  wire.position.y = 3.7;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 24), gold);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 2.74;

  // النقطة المضيئة
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xfff3c9, emissive: 0xffd98a, emissiveIntensity: 2.5 }),
  );
  bulb.position.y = 2.72;

  group.add(shade, wire, ring, bulb);
  scene.add(group);

  return { group, bulb, gold, shade };
}

export default function LandingScene() {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [isMobile, setIsMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 760);
  }, []);

  useEffect(() => {
    if (!mountRef.current || isMobile) return;
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3a2447);

    // توهّج خلفي
    const bgGlow = new THREE.Mesh(
      new THREE.SphereGeometry(14, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x452a52, transparent: true, opacity: 0.9 }),
    );
    scene.add(bgGlow);

    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 2.2, 7.4);
    camera.lookAt(0, 1.7, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // إضاءة
    const lamp = new THREE.PointLight(0xffd98a, 22, 14);
    lamp.position.set(0, 2.7, 0);
    scene.add(lamp);
    scene.add(new THREE.AmbientLight(0x8a6fc8, 0.55));
    const back = new THREE.DirectionalLight(0xffe9c0, 0.9);
    back.position.set(-4, 5, 6);

    // الورقة
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf7f1e2, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xdddddd, emissiveIntensity: 0.4,
    });
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.58), paperMat);
    paper.position.set(0, 1.4, 0);

    const lampG = buildLamp(scene);

    // تغيّرات عند الضغط على ابدأ
    let phaseState: Phase = 'idle';
    const setP = (p: Phase) => {
      phaseState = p;
      setPhase(p);
    };

    const clock = new THREE.Clock();
    let animT = 0;

    const raf = function animate() {
      const dt = clock.getDelta();
      const t = clock.elapsedTime;

      // الورقة تتمايل
      paper.rotation.y = Math.sin(t * 0.8) * 0.06;
      paper.position.y = 1.4 + Math.sin(t * 1.2) * 0.03;

      if (phaseState === 'idle') {
        lamp.position.set(0, 2.7, 0);
      } else if (phaseState === 'action') {
        animT += dt;
        const p = Math.min(animT / 2.2, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        paper.position.y = 1.4 + ease * 1.2;
        paper.rotation.x = ease * 0.6;
        lamp.position.y = 2.7 - 0.15 * ease;
        if (p > 1) {
          setP('leaving');
          setTimeout(() => { router.push('/room'); }, 550);
        }
      } else if (phaseState === 'leaving') {
        // المصباح يُشعل ويضيء الغرفة
        const p = Math.min(animT / 1.1, 1);
        lamp.intensity = 30 + 90 * p;
        lampG.gold.emissiveIntensity = 0.6 + 2.2 * p;
        lampG.bulb.material.emissiveIntensity = 2.5 + 6 * p;
        lamp.position.y = 2.7 - 0.3 * p;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(raf);
    };

    raf();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const begin = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      animT = 0;
      setP('action');
    };
    mount.addEventListener('click', begin);

    return () => {
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('click', begin);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, router]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* خلفية */}
      <div className="absolute inset-0" style={{
        background:
          'radial-gradient(900px 500px at 50% 0%, rgba(201,169,98,0.16), transparent 60%), radial-gradient(700px 500px at 15% 100%, rgba(238,127,174,0.12), transparent 55%), #3a2447',
      }} />

      {/* المشهد */}
      {!isMobile ? (
        <div ref={mountRef} className="absolute inset-0 z-[1]" style={{ cursor: 'pointer' }} />
      ) : (
        /* نسخة خفيفة للموبايل */
        <div className="absolute inset-0 z-[1] flex items-center justify-center">
          <div className="floaty text-center">
            <div className="w-40 h-2 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #c9a962, transparent)' }} />
            <div className="text-6xl mt-6 mb-2 glow-pulse">🤝</div>
            <div className="text-sm text-[var(--muted)] mt-1">طالب يساعد طالبًا</div>
          </div>
        </div>
      )}

      {/* المحتوى الأمامي */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pointer-events-none">
        <div className="mt-[16vh] md:mt-[8vh] text-center pointer-events-auto">
          <p className="text-lg md:text-2xl text-[var(--muted)] mt-2 font-semibold">
            طالب يساعد طالبًا
          </p>
          <p className="text-sm md:text-base text-[var(--muted)]/70 mt-3 max-w-md mx-auto leading-relaxed">
            غرفة فوجك الرقمية: مقياس، واجب، دردشة، جدول، وموضوع مهم — كل ما تحتاجه في مكان واحد.
          </p>

          <button
            className="btn btn-gold mt-6 text-lg px-8 py-3.5"
            style={{ transform: phase === 'action' || phase === 'leaving' ? 'scale(.96)' : undefined, pointerEvents: startedRef.current ? 'auto' : 'auto' }}
            onClick={() => {
              if (isMobile) { router.push('/room'); return; }
              startedRef.current = true;
              setPhase('action');
              setTimeout(() => router.push('/room'), 2600);
            }}
          >
            {phase === 'idle' ? 'ادخل القاعة' : 'جاري التحضير…'}
          </button>

          <div className="mt-3">
            <button
              type="button"
              className="text-sm font-semibold opacity-80 hover:opacity-100 underline underline-offset-4"
              style={{ color: 'var(--gold-2)' }}
              disabled={busy}
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                try {
                  const r = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'student@demo.dz', password: 'demo123' }),
                  });
                  if (!r.ok) { setBusy(false); alert('تعذر الدخول السريع — جرّب التسجيل أولاً'); return; }
                  window.location.href = '/room';
                } catch { setBusy(false); alert('تعذر الدخول السريع — تحقق من الخادم'); }
              }}
            >
              {busy ? 'جارٍ الدخول…' : 'تخطَّ وادخل مباشرة (دخول تجريبي)'}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-[11px] text-[var(--muted)]/50 pointer-events-none">
        {isMobile ? 'اضغط «ادخل القاعة» للانطلاق' : 'اضغط «ادخل القاعة» أو على المشهد'}
      </div>
    </div>
  );
}