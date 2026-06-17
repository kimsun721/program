"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  clientKey: string;
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail: string;
  customerName: string;
}

type TossWidgets = Awaited<
  ReturnType<Awaited<ReturnType<typeof loadTossPayments>>["widgets"]>
>;

export default function TossPaymentWidget({
  clientKey,
  orderId,
  orderName,
  amount,
  customerEmail,
  customerName,
}: Props) {
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const widgetsRef = useRef<TossWidgets | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!clientKey) {
        setInitError("결제 모듈 설정이 누락되었습니다. (클라이언트 키 없음)");
        return;
      }
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        widgetsRef.current = widgets;

        await widgets.setAmount({ value: amount, currency: "KRW" });

        const [, agreementWidget] = await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#payment-method",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#agreement",
            variantKey: "AGREEMENT",
          }),
        ]);

        // 약관 동의 상태 구독
        agreementWidget.on("agreementStatusChange", (status) => {
          if (!cancelled) setAgreed(status.agreedRequiredTerms);
        });

        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("Toss 위젯 초기화 실패:", e);
        if (!cancelled) {
          setInitError("결제 수단을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [clientKey, amount]);

  const handlePay = async () => {
    if (!widgetsRef.current) return;
    setPaying(true);
    setPayError(null);
    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail,
        customerName,
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 경우(USER_CANCEL)는 무시하고, 실제 오류만 노출
      const code = (e as { code?: string })?.code;
      if (code !== "USER_CANCEL" && code !== "PAY_PROCESS_CANCELED") {
        const msg = (e as { message?: string })?.message;
        setPayError(msg || "결제 요청 중 오류가 발생했습니다.");
      }
      console.error(e);
    } finally {
      setPaying(false);
    }
  };

  if (initError) {
    return (
      <div className="flex flex-col items-center py-12 gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-gray-600">{initError}</p>
        <Link
          href="/courses"
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          강의 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div>
      {!ready && (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">결제 수단을 불러오는 중...</p>
        </div>
      )}

      <div id="payment-method" className={ready ? "" : "hidden"} />
      <div id="agreement" className={ready ? "mt-4" : "hidden"} />

      {payError && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {payError}
        </p>
      )}

      {ready && (
        <Button
          onClick={handlePay}
          disabled={!agreed || paying}
          className="w-full mt-6 h-12 text-base font-bold"
        >
          {paying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              처리 중...
            </>
          ) : (
            `${amount.toLocaleString("ko-KR")}원 결제하기`
          )}
        </Button>
      )}
    </div>
  );
}
