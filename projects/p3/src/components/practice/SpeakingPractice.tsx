"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, ChevronRight, ChevronLeft, Volume2, CheckCircle2, XCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { savePracticeResult } from "@/actions/practice";

type Prompt = { text: string; hint: string };

type RecognitionResult = "correct" | "close" | "wrong" | null;

function similarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;

  const wordsA = na.split(/\s+/);
  const wordsB = nb.split(/\s+/);
  const common = wordsA.filter((w) => wordsB.includes(w)).length;
  return (common * 2) / (wordsA.length + wordsB.length);
}

export function SpeakingPractice({ prompts }: { prompts: Prompt[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<RecognitionResult>(null);
  const [scores, setScores] = useState<RecognitionResult[]>([]);
  const [done, setDone] = useState(false);
  const [startTime] = useState(() => Date.now());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const current = prompts[currentIdx];

  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US";
      utt.rate = 0.85;
      speechSynthesis.speak(utt);
    }
  }, []);

  useEffect(() => {
    setTranscript("");
    setResult(null);
  }, [currentIdx]);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("이 브라우저는 음성인식을 지원하지 않습니다. Chrome을 사용해주세요.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const best = Array.from({ length: event.results[0].length }, (_: unknown, i: number) =>
        event.results[0][i].transcript
      ).sort((a: string, b: string) => similarity(b, current.text) - similarity(a, current.text))[0];

      setTranscript(best);
      const score = similarity(best, current.text);
      const r: RecognitionResult = score >= 0.9 ? "correct" : score >= 0.6 ? "close" : "wrong";
      setResult(r);
    };

    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [current]);

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const handleNext = async () => {
    const newScores = [...scores, result];

    if (currentIdx + 1 >= prompts.length) {
      const correctCount = newScores.filter((s) => s === "correct" || s === "close").length;
      const sec = Math.round((Date.now() - startTime) / 1000);
      await savePracticeResult("speaking", "SPEAKING", prompts.length, correctCount, sec);
      setScores(newScores);
      setDone(true);
    } else {
      setScores(newScores);
      setCurrentIdx((i) => i + 1);
    }
  };

  const handleSkip = async () => {
    const newScores = [...scores, "wrong" as RecognitionResult];
    if (currentIdx + 1 >= prompts.length) {
      const correctCount = newScores.filter((s) => s === "correct" || s === "close").length;
      const sec = Math.round((Date.now() - startTime) / 1000);
      await savePracticeResult("speaking", "SPEAKING", prompts.length, correctCount, sec);
      setScores(newScores);
      setDone(true);
    } else {
      setScores(newScores);
      setCurrentIdx((i) => i + 1);
    }
  };

  if (done) {
    const correct = scores.filter((s) => s === "correct").length;
    const close = scores.filter((s) => s === "close").length;
    const wrong = scores.filter((s) => s === "wrong" || s === null).length;
    const accuracy = Math.round(((correct + close * 0.7) / prompts.length) * 100);

    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <div className="text-6xl mb-4">{accuracy >= 80 ? "🎤" : accuracy >= 60 ? "💬" : "📢"}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {accuracy >= 80 ? "발음이 훌륭해요!" : accuracy >= 60 ? "꽤 잘 하셨어요!" : "계속 연습해봐요!"}
        </h2>
        <p className="text-gray-500 mb-6">스피킹 연습 완료</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="text-5xl font-bold text-orange-500 mb-2">{accuracy}%</div>
          <p className="text-sm text-gray-500 mb-4">종합 점수</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-2xl font-bold text-green-600">{correct}</p>
              <p className="text-gray-400">정확</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{close}</p>
              <p className="text-gray-400">거의 정확</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{wrong}</p>
              <p className="text-gray-400">틀림</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/my/practice/speaking"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
          >
            <RotateCcw className="h-4 w-4" />
            다시 하기
          </Link>
          <Link
            href="/my/practice"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
          >
            <Home className="h-4 w-4" />
            연습 홈
          </Link>
        </div>
      </div>
    );
  }

  const progress = (currentIdx / prompts.length) * 100;

  return (
    <div className="container mx-auto px-4 py-6 max-w-xl">
      {/* 상단 */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/my/practice" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          연습 목록
        </Link>
        <div className="text-center">
          <h1 className="text-sm font-semibold text-gray-700">스피킹 연습</h1>
          <p className="text-xs text-gray-400">{currentIdx + 1} / {prompts.length}</p>
        </div>
        <div className="w-16" />
      </div>

      {/* 진행 바 */}
      <div className="h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 힌트 */}
      <div className="text-center mb-4">
        <span className="text-xs font-medium text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
          {current.hint}
        </span>
      </div>

      {/* 문장 카드 */}
      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-lg p-8 mb-6 text-center">
        <p className="text-2xl font-bold text-gray-900 leading-relaxed">{current.text}</p>
        <button
          onClick={() => speak(current.text)}
          className="flex items-center gap-2 mx-auto mt-4 text-sm text-gray-400 hover:text-orange-600 transition-colors"
        >
          <Volume2 className="h-4 w-4" />
          원어민 발음 듣기
        </button>
      </div>

      {/* 인식 결과 */}
      {transcript && (
        <div className={`rounded-xl p-4 mb-4 text-center border-2 ${
          result === "correct" ? "bg-green-50 border-green-200" :
          result === "close" ? "bg-yellow-50 border-yellow-200" :
          "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {result === "correct" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : result === "close" ? (
              <CheckCircle2 className="h-5 w-5 text-yellow-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={`font-semibold text-sm ${
              result === "correct" ? "text-green-700" :
              result === "close" ? "text-yellow-700" :
              "text-red-600"
            }`}>
              {result === "correct" ? "완벽해요!" : result === "close" ? "거의 맞아요!" : "다시 해보세요"}
            </span>
          </div>
          <p className="text-gray-600 text-sm italic">&ldquo;{transcript}&rdquo;</p>
        </div>
      )}

      {/* 마이크 버튼 */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isListening
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {isListening ? (
            <MicOff className="h-8 w-8 text-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </button>
        <p className="text-xs text-gray-400">
          {isListening ? "듣고 있어요... 말해보세요!" : "버튼을 눌러 말해보세요"}
        </p>
      </div>

      {/* 다음/건너뛰기 */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSkip}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-500 font-medium hover:bg-gray-200 transition-colors text-sm"
        >
          건너뛰기
        </button>
        {result && (
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            다음 <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
