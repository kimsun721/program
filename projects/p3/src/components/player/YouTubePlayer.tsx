"use client";

import { useEffect, useRef, useState } from "react";
import { saveProgress } from "@/actions/enrollments";

type Props = {
  videoId: string;
  enrollmentId: string;
  lectureId: string;
  initialWatchedSeconds?: number;
};

// 최소한의 YouTube IFrame API 타입 정의
type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (sec: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
};
type YTEvent = { target: YTPlayer; data: number };
type YTState = -1 | 0 | 1 | 2 | 3 | 5;

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: YTEvent) => void;
            onStateChange?: (e: YTEvent) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STATE_ENDED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;

let apiReadyPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiReadyPromise) return apiReadyPromise;

  apiReadyPromise = new Promise<void>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
  return apiReadyPromise;
}

export default function YouTubePlayer({
  videoId,
  enrollmentId,
  lectureId,
  initialWatchedSeconds = 0,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const lastSavedRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);

  const persist = async (current: number, completed: boolean) => {
    try {
      await saveProgress(
        enrollmentId,
        lectureId,
        Math.floor(current),
        completed
      );
      lastSavedRef.current = current;
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadYouTubeApi();
      if (cancelled || !hostRef.current || !window.YT) return;

      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          start: Math.floor(initialWatchedSeconds),
        },
        events: {
          onReady: () => {
            setReady(true);
            if (initialWatchedSeconds > 0) {
              try {
                playerRef.current?.seekTo(initialWatchedSeconds, true);
              } catch {}
            }
          },
          onStateChange: (e) => {
            const state = e.data as YTState;
            const cur = e.target.getCurrentTime();
            const dur = e.target.getDuration();
            if (state === STATE_PAUSED && cur > lastSavedRef.current + 10) {
              const completed = dur > 0 && cur / dur >= 0.9;
              void persist(cur, completed);
            }
            if (state === STATE_ENDED) {
              void persist(dur, true);
            }
          },
        },
      });
    })();

    return () => {
      cancelled = true;
      if (tickRef.current) clearInterval(tickRef.current);
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
    };
    // 비디오가 바뀌면 다시 마운트되어야 하므로 deps는 안정 값 위주.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // 30초마다 재생 위치 자동 저장
  useEffect(() => {
    if (!ready) return;
    tickRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      let cur = 0;
      let dur = 0;
      try {
        cur = p.getCurrentTime();
        dur = p.getDuration();
      } catch {
        return;
      }
      if (cur > lastSavedRef.current + 5) {
        const completed = dur > 0 && cur / dur >= 0.9;
        void persist(cur, completed);
      }
    }, 30_000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [ready]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">YouTube 로딩 중...</p>
          </div>
        </div>
      )}
      <div ref={hostRef} className="w-full h-full" />
    </div>
  );
}
