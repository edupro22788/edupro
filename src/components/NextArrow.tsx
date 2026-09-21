'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const style: React.CSSProperties = {
  position: 'fixed',
  right: 20,
  top: '50%',
  width: 54,
  height: 54,
  transform: 'translateY(-50%)',
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#e3c27c,#b8934a)',
  color: '#13140f',
  boxShadow: '0 14px 34px rgba(0,0,0,.45)',
  border: '1px solid rgba(255,230,170,.5)',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function NextArrow({ href, onClick, disabled }: { href?: string; onClick?: () => void; disabled?: boolean }) {
  const inner = <ChevronLeft size={26} />;
  const finalStyle = { ...style, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer' };
  if (href && !disabled) {
    return (
      <Link href={href} className="fixed flex items-center justify-center fade-up" style={finalStyle}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className="fixed flex items-center justify-center fade-up" style={finalStyle} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}