"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/**
 * 학습(풀스크린 플레이어) 페이지에서는 전역 푸터를 숨긴다.
 * 그렇지 않으면 100vh 레이아웃 위로 푸터가 겹쳐 올라온다.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (/^\/my\/[^/]+\/learn/.test(pathname ?? "")) return null;
  return <Footer />;
}
