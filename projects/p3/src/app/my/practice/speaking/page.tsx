import { SpeakingPractice } from "@/components/practice/SpeakingPractice";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "스피킹 연습" };

const PROMPTS = [
  { text: "Hello, nice to meet you!", hint: "인사 표현" },
  { text: "I would like to order a coffee, please.", hint: "주문 표현" },
  { text: "Could you please repeat that?", hint: "되묻기 표현" },
  { text: "I'm looking for the nearest subway station.", hint: "길 묻기" },
  { text: "The weather is really nice today.", hint: "날씨 표현" },
  { text: "What time does the store close?", hint: "시간 묻기" },
  { text: "I've been studying English for two years.", hint: "기간 표현" },
  { text: "Can you recommend a good restaurant?", hint: "추천 요청" },
  { text: "I'm sorry, I'm late.", hint: "사과 표현" },
  { text: "How much does this cost?", hint: "가격 묻기" },
  { text: "Let me think about it.", hint: "생각 중 표현" },
  { text: "That sounds like a great idea!", hint: "동의 표현" },
];

export default function SpeakingPracticePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <SpeakingPractice prompts={PROMPTS} />
    </div>
  );
}
