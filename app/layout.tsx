import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TWS 42 Shared Message Service",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
