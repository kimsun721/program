import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "LinguaClass - 외국어 온라인 강의",
    template: "%s | LinguaClass",
  },
  description:
    "전문 강사들의 체계적인 커리큘럼으로 외국어를 효율적으로 배우세요. 영어, 일본어, 중국어, 스페인어, 프랑스어 강의를 제공합니다.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col antialiased">
        <SessionProvider session={session}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
