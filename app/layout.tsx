import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ParseProgressProvider } from "@/components/providers/parse-progress-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 智能知识图谱笔记",
  description: "上传文档，自动解析，图谱可视化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ParseProgressProvider>{children}</ParseProgressProvider>
      </body>
    </html>
  );
}
