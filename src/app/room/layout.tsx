import type { ReactNode } from 'react';
import TopNav from '@/components/TopNav';
import SideNav from '@/components/SideNav';

export default function RoomLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      <SideNav />
      <main className="flex-1 md:pl-20">{children}</main>
    </>
  );
}