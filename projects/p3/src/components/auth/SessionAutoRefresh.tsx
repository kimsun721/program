"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function SessionAutoRefresh() {
  const { update, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    // 탭이 다시 활성화되거나 창이 포커스를 얻으면 세션 강제 갱신.
    // 서버 jwt 콜백이 DB에서 최신 role/status를 다시 읽어 즉시 반영한다.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void update();
      }
    };
    const onFocus = () => {
      void update();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, update]);

  return null;
}
