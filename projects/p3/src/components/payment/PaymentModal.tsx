"use client";

import { useState, useTransition } from "react";
import { initiatePayment } from "@/actions/payments";
import { formatPrice } from "@/lib/utils";
import { CreditCard, Smartphone, Building2, CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Method = "CARD" | "KAKAO" | "TOSS" | "VBANK";

const methods: { id: Method; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "CARD", label: "신용/체크카드", icon: CreditCard, desc: "국내외 모든 카드" },
  { id: "KAKAO", label: "카카오페이", icon: Smartphone, desc: "카카오톡으로 간편결제" },
  { id: "TOSS", label: "토스페이", icon: Smartphone, desc: "토스로 간편결제" },
  { id: "VBANK", label: "가상계좌", icon: Building2, desc: "무통장 입금" },
];

export function PaymentModal({
  courseId,
  courseTitle,
  price,
  onClose,
}: {
  courseId: string;
  courseTitle: string;
  price: number;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<Method>("CARD");
  const [step, setStep] = useState<"select" | "processing" | "done">("select");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePay = () => {
    startTransition(async () => {
      setError(null);
      setStep("processing");

      const initResult = await initiatePayment(courseId);
      if ("error" in initResult) {
        setError(initResult.error ?? "오류가 발생했습니다.");
        setStep("select");
        return;
      }

      if ("free" in initResult && initResult.free) {
        setStep("done");
        setTimeout(() => {
          onClose();
          router.push(`/my/${courseId}/learn`);
        }, 1500);
        return;
      }

      // 유료 강의: Toss 결제 페이지로 이동
      onClose();
      router.push(`/payment?courseId=${courseId}`);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">결제하기</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          {step === "processing" ? (
            <div className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="font-semibold text-gray-700">결제 처리 중...</p>
              <p className="text-sm text-gray-500 mt-1">잠시만 기다려주세요</p>
            </div>
          ) : step === "done" ? (
            <div className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="font-bold text-xl text-gray-800">결제 완료!</p>
              <p className="text-sm text-gray-500 mt-2">강의를 시작합니다 🎉</p>
            </div>
          ) : (
            <>
              {/* 강의 정보 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-500">결제 강의</p>
                <p className="font-semibold text-gray-900 mt-0.5">{courseTitle}</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{formatPrice(price)}</p>
              </div>

              {/* 결제 수단 */}
              <div className="space-y-2 mb-5">
                <p className="text-sm font-medium text-gray-700 mb-3">결제 수단 선택</p>
                {methods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        method === m.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${method === m.id ? "bg-blue-100" : "bg-gray-100"}`}>
                        <Icon className={`h-4 w-4 ${method === m.id ? "text-blue-600" : "text-gray-500"}`} />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-medium ${method === m.id ? "text-blue-700" : "text-gray-800"}`}>
                          {m.label}
                        </p>
                        <p className="text-xs text-gray-400">{m.desc}</p>
                      </div>
                      {method === m.id && (
                        <div className="ml-auto h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                onClick={handlePay}
                disabled={isPending}
                className="w-full h-12 text-base font-semibold"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `${formatPrice(price)} 결제하기`
                )}
              </Button>

              <p className="text-center text-xs text-gray-400 mt-3">
                🔒 모의 결제 — 실제 금액이 청구되지 않습니다
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
