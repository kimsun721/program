"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const widgetsRef = useRef<TossWidgets | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
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
      // 사용자가 결제창 닫은 경우 등 — 에러 무시
      console.error(e);
    } finally {
      setPaying(false);
    }
  };

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
