import type { Metadata } from "next";
import { DM_Mono, Noto_Serif_SC } from "next/font/google";
import { ParseProgressProvider } from "@/components/providers/parse-progress-provider";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/600.css";
import "@fontsource/noto-sans-sc/700.css";
import "./globals.css";

const notoSerifDisplay = Noto_Serif_SC({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
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
      className={`${notoSerifDisplay.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-background text-foreground">
        <ParseProgressProvider>{children}</ParseProgressProvider>
      </body>
    </html>
  );
}
