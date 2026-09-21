import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EDU PRO — طالب يساعد طالبًا",
  description: "منصة جامعية رقمية لأفواج الطلبة في الجزائر: شارك، تعلّم، تعاون.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}