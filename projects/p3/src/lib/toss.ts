export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY not configured");

  const authorization = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Toss 결제 승인 실패");
  }

  return data as {
    paymentKey: string;
    orderId: string;
    method: string;
    totalAmount: number;
    status: string;
  };
}
