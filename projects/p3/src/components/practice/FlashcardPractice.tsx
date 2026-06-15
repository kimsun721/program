"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { submitFlashcardResult, savePracticeResult } from "@/actions/practice";
import {
  ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle,
  Zap, BookOpen, Trophy, Home, Volume2, Timer
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Item = { id: string; term: string; meaning: string; example?: string };
type Mode = "FLASHCARD" | "QUIZ";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateChoices(items: Item[], correctItem: Item): Item[] {
  const wrong = shuffle(items.filter((i) => i.id !== correctItem.id)).slice(0, 3);
  return shuffle([correctItem, ...wrong]);
}

// ─── 플래시카드 ───────────────────────────────────────────────

function FlashCard({
  item,
  onResult,
}: {
  item: Item;
  onResult: (quality: number) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => setFlipped(false), [item.id]);

  const speak = () => {
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(item.term);
      utt.lang = "en-US";
      speechSynthesis.speak(utt);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* 카드 */}
      <div
        className="w-full cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "240px",
          }}
        >
          {/* 앞면 - 단어 */}
          <div
            className="absolute inset-0 rounded-2xl bg-white border-2 border-purple-100 shadow-lg flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs font-semibold text-purple-400 uppercase mb-4">단어</p>
            <p className="text-4xl font-bold text-gray-900 text-center">{item.term}</p>
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={(e) => { e.stopPropagation(); speak(); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-600 transition-colors"
              >
                <Volume2 className="h-4 w-4" />
                발음 듣기
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4">클릭하면 뜻이 나와요</p>
          </div>

          {/* 뒷면 - 뜻 */}
          <div
            className="absolute inset-0 rounded-2xl bg-purple-600 shadow-lg flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-xs font-semibold text-purple-300 uppercase mb-4">뜻</p>
            <p className="text-3xl font-bold text-white text-center">{item.meaning}</p>
            {item.example && (
              <p className="text-sm text-purple-200 text-center mt-4 italic">
                &ldquo;{item.example}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 버튼 */}
      {flipped ? (
        <div className="flex gap-3 w-full">
          <button
            onClick={() => onResult(1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 font-semibold hover:bg-red-100 transition-colors"
          >
            <XCircle className="h-5 w-5" />
            몰라요
          </button>
          <button
            onClick={() => onResult(3)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-50 border-2 border-yellow-200 text-yellow-700 font-semibold hover:bg-yellow-100 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            애매해요
          </button>
          <button
            onClick={() => onResult(5)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 border-2 border-green-200 text-green-600 font-semibold hover:bg-green-100 transition-colors"
          >
            <CheckCircle2 className="h-5 w-5" />
            알아요
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
        >
          뒤집기
        </button>
      )}
    </div>
  );
}

// ─── 퀴즈 카드 ───────────────────────────────────────────────

function QuizCard({
  item,
  allItems,
  onResult,
}: {
  item: Item;
  allItems: Item[];
  onResult: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const choices = useRef<Item[]>(generateChoices(allItems, item));

  useEffect(() => {
    setSelected(null);
    choices.current = generateChoices(allItems, item);
  }, [item.id, allItems]);

  const handleSelect = (choiceId: string) => {
    if (selected !== null) return;
    setSelected(choiceId);
    setTimeout(() => onResult(choiceId === item.id), 800);
  };

  const speak = () => {
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(item.term);
      utt.lang = "en-US";
      speechSynthesis.speak(utt);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* 문제 */}
      <div className="bg-white rounded-2xl border-2 border-green-100 shadow-lg p-8 mb-6 text-center">
        <p className="text-xs font-semibold text-green-400 uppercase mb-3">다음 단어의 뜻은?</p>
        <p className="text-4xl font-bold text-gray-900">{item.term}</p>
        <button
          onClick={speak}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-600 transition-colors mx-auto mt-4"
        >
          <Volume2 className="h-4 w-4" />
          발음 듣기
        </button>
      </div>

      {/* 보기 */}
      <div className="grid grid-cols-2 gap-3">
        {choices.current.map((choice) => {
          let style = "bg-white border-2 border-gray-200 text-gray-800 hover:border-green-300";
          if (selected !== null) {
            if (choice.id === item.id) style = "bg-green-50 border-2 border-green-500 text-green-700";
            else if (choice.id === selected) style = "bg-red-50 border-2 border-red-400 text-red-600";
            else style = "bg-white border-2 border-gray-100 text-gray-400 opacity-60";
          }
          return (
            <button
              key={choice.id}
              onClick={() => handleSelect(choice.id)}
              className={`p-4 rounded-xl font-medium text-sm transition-all ${style}`}
            >
              {choice.meaning}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 결과 화면 ────────────────────────────────────────────────

function ResultScreen({
  correct,
  total,
  durationSec,
  mode,
  bookId,
}: {
  correct: number;
  total: number;
  durationSec: number;
  mode: Mode;
  bookId: string;
}) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const router = useRouter();

  const emoji = accuracy >= 90 ? "🏆" : accuracy >= 70 ? "🌟" : accuracy >= 50 ? "💪" : "📚";
  const message =
    accuracy >= 90 ? "완벽해요! 훌륭합니다!" :
    accuracy >= 70 ? "잘 하셨어요!" :
    accuracy >= 50 ? "조금 더 연습해봐요!" :
    "다시 도전해봐요!";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-sm mx-auto text-center gap-6">
      <div className="text-6xl">{emoji}</div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
        <p className="text-gray-500">
          {mode === "FLASHCARD" ? "플래시카드" : "퀴즈"} 완료
        </p>
      </div>

      {/* 통계 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full">
        <div className="text-5xl font-bold text-purple-600 mb-1">{accuracy}%</div>
        <p className="text-sm text-gray-500 mb-4">정답률</p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-2xl font-bold text-green-600">{correct}</p>
            <p className="text-gray-400">정답</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{total - correct}</p>
            <p className="text-gray-400">오답</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">{durationSec}초</p>
            <p className="text-gray-400">소요시간</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={() => router.refresh()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700"
        >
          <RotateCcw className="h-4 w-4" />
          다시 하기
        </button>
        <Link
          href="/my/practice"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
        >
          <Home className="h-4 w-4" />
          목록으로
        </Link>
      </div>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────

export function FlashcardPractice({
  bookId,
  bookTitle,
  items,
  initialMode,
}: {
  bookId: string;
  bookTitle: string;
  items: Item[];
  initialMode: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [queue, setQueue] = useState(() => shuffle(items));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [startTime] = useState(() => Date.now());

  const currentItem = queue[currentIdx];

  const handleFlashcardResult = useCallback(
    async (quality: number) => {
      await submitFlashcardResult(currentItem.id, quality);
      if (quality >= 3) setCorrect((c) => c + 1);
      if (currentIdx + 1 >= queue.length) {
        const sec = Math.round((Date.now() - startTime) / 1000);
        await savePracticeResult(bookId, mode, queue.length, correct + (quality >= 3 ? 1 : 0), sec);
        setDone(true);
      } else {
        setCurrentIdx((i) => i + 1);
      }
    },
    [currentItem, currentIdx, queue.length, correct, bookId, mode, startTime]
  );

  const handleQuizResult = useCallback(
    async (isCorrect: boolean) => {
      if (isCorrect) setCorrect((c) => c + 1);
      if (currentIdx + 1 >= queue.length) {
        const sec = Math.round((Date.now() - startTime) / 1000);
        await savePracticeResult(bookId, mode, queue.length, correct + (isCorrect ? 1 : 0), sec);
        setDone(true);
      } else {
        setCurrentIdx((i) => i + 1);
      }
    },
    [currentIdx, queue.length, correct, bookId, mode, startTime]
  );

  if (done) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ResultScreen
          correct={correct}
          total={queue.length}
          durationSec={Math.round((Date.now() - startTime) / 1000)}
          mode={mode}
          bookId={bookId}
        />
      </div>
    );
  }

  const progress = ((currentIdx) / queue.length) * 100;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* 상단 */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/my/practice"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          연습 목록
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-gray-700 text-center">{bookTitle}</h1>
          <p className="text-xs text-gray-400 text-center">{currentIdx + 1} / {queue.length}</p>
        </div>
        {/* 모드 전환 */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => { setMode("FLASHCARD"); setCurrentIdx(0); setCorrect(0); setQueue(shuffle(items)); }}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              mode === "FLASHCARD" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 inline mr-1" />카드
          </button>
          <button
            onClick={() => { setMode("QUIZ"); setCurrentIdx(0); setCorrect(0); setQueue(shuffle(items)); }}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              mode === "QUIZ" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <Zap className="h-3.5 w-3.5 inline mr-1" />퀴즈
          </button>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 연습 카드 */}
      {mode === "FLASHCARD" ? (
        <FlashCard item={currentItem} onResult={handleFlashcardResult} />
      ) : (
        <QuizCard item={currentItem} allItems={items} onResult={handleQuizResult} />
      )}

      {/* 하단 통계 */}
      <div className="flex justify-center gap-6 mt-8 text-sm">
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-semibold">{correct}</span>
          <span className="text-gray-400">정답</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-400">
          <XCircle className="h-4 w-4" />
          <span className="font-semibold">{currentIdx - correct}</span>
          <span className="text-gray-400">오답</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Timer className="h-4 w-4" />
          <span className="font-semibold">{queue.length - currentIdx}</span>
          <span className="text-gray-400">남음</span>
        </div>
      </div>
    </div>
  );
}
