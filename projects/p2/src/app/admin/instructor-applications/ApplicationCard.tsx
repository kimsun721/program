"use client";

import { useState, useTransition } from "react";
import {
  adminApproveInstructor,
  adminRejectInstructor,
} from "@/actions/admin";

type App = {
  id: string;
  status: string;
  realName: string;
  headline: string;
  description: string;
  career: string;
  rejectionReason: string | null;
  createdAt: Date;
  user: { email: string; nickname: string };
};

export function ApplicationCard({ app }: { app: App }) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const approve = () => {
    setError(null);
    startTransition(async () => {
      const res = await adminApproveInstructor(app.id);
      if ("error" in res && res.error) setError(res.error);
    });
  };

  const reject = () => {
    setError(null);
    startTransition(async () => {
      const res = await adminRejectInstructor(app.id, reason);
      if ("error" in res && res.error) setError(res.error);
      else setShowReject(false);
    });
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-base font-semibold">
            {app.realName}{" "}
            <span className="text-sm font-normal text-slate-500">
              ({app.user.nickname} · {app.user.email})
            </span>
          </div>
          <div className="text-sm text-slate-600">{app.headline}</div>
        </div>
        <span
          className={
            "rounded-full px-2 py-0.5 text-xs " +
            (app.status === "PENDING"
              ? "bg-amber-100 text-amber-700"
              : app.status === "APPROVED"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700")
          }
        >
          {app.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold text-slate-500">자기소개</div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{app.description}</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500">경력</div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{app.career}</p>
        </div>
      </div>

      {app.status === "REJECTED" && app.rejectionReason && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          반려 사유: {app.rejectionReason}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {app.status === "PENDING" && (
        <div className="mt-4 flex gap-2">
          <button
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            disabled={pending}
            onClick={approve}
          >
            승인
          </button>
          <button
            className="rounded border px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            disabled={pending}
            onClick={() => setShowReject((v) => !v)}
          >
            반려
          </button>
        </div>
      )}

      {showReject && (
        <div className="mt-3 rounded-md border bg-slate-50 p-3">
          <label className="text-xs font-semibold text-slate-600">
            반려 사유 (5자 이상)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            rows={3}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              className="rounded border px-3 py-1 text-sm"
              onClick={() => setShowReject(false)}
            >
              취소
            </button>
            <button
              className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              disabled={pending || reason.trim().length < 5}
              onClick={reject}
            >
              반려 처리
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
