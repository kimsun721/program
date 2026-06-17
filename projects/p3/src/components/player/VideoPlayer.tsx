"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Hls from "hls.js";
import { saveProgress } from "@/actions/enrollments";
import { parseVideoSource } from "@/lib/video";
import YouTubePlayer from "./YouTubePlayer";

interface VideoPlayerProps {
  src: string;
  enrollmentId: string;
  lectureId: string;
  initialWatchedSeconds?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
}

export default function VideoPlayer(props: VideoPlayerProps) {
  const source = parseVideoSource(props.src);

  if (source?.kind === "youtube") {
    return (
      <YouTubePlayer
        videoId={source.videoId}
        enrollmentId={props.enrollmentId}
        lectureId={props.lectureId}
        initialWatchedSeconds={props.initialWatchedSeconds ?? 0}
      />
    );
  }

  return <HlsVideoPlayer {...props} />;
}

function HlsVideoPlayer({
  src,
  enrollmentId,
  lectureId,
  initialWatchedSeconds = 0,
  onProgress,
}: VideoPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSavedRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleSaveProgress = useCallback(
    async (currentTime: number, isCompleted: boolean) => {
      try {
        await saveProgress(enrollmentId, lectureId, Math.floor(currentTime), isCompleted);
        lastSavedRef.current = currentTime;
        onProgress?.(currentTime, isCompleted);
        // 차시를 처음 완료한 순간에만 화면(체크표시·진도바)을 갱신
        if (isCompleted && !completedRef.current) {
          completedRef.current = true;
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    [enrollmentId, lectureId, onProgress, router]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const initPlayer = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError("영상을 불러오는 중 오류가 발생했습니다.");
            console.error("HLS error:", data);
          }
        });

        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsReady(true);
          if (initialWatchedSeconds > 0) {
            video.currentTime = initialWatchedSeconds;
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS support
        video.src = src;
        setIsReady(true);
        if (initialWatchedSeconds > 0) {
          video.currentTime = initialWatchedSeconds;
        }
      } else {
        setError("이 브라우저는 HLS 스트리밍을 지원하지 않습니다.");
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, initialWatchedSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto-save every 30 seconds
    saveIntervalRef.current = setInterval(() => {
      if (!video.paused && video.currentTime > lastSavedRef.current) {
        const duration = video.duration;
        const isCompleted =
          duration > 0 && video.currentTime / duration >= 0.9;
        handleSaveProgress(video.currentTime, isCompleted);
      }
    }, 30000);

    const handleEnded = () => {
      handleSaveProgress(video.duration, true);
    };

    const handlePause = () => {
      if (video.currentTime > lastSavedRef.current + 10) {
        const duration = video.duration;
        const isCompleted =
          duration > 0 && video.currentTime / duration >= 0.9;
        handleSaveProgress(video.currentTime, isCompleted);
      }
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("pause", handlePause);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("pause", handlePause);
    };
  }, [handleSaveProgress]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-900 aspect-video rounded-lg">
        <div className="text-center text-white">
          <p className="text-lg mb-2">⚠️</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">영상 로딩 중...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        preload="metadata"
      />
    </div>
  );
}
