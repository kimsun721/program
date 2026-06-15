"use client";

import { useTransition } from "react";
import { adminUpdateUserStatus } from "@/actions/admin";
import { userStatusLabel } from "@/lib/status";

type Props = {
  user: {
    id: string;
    email: string;
    nickname: string;
    role: string[];
    status: string;
    createdAt: Date;
  };
};

export function UserRow({ user }: Props) {
  const [pending, startTransition] = useTransition();

  const apply = (status: "ACTIVE" | "SUSPENDED" | "DELETED") => {
    if (status === "DELETED") {
      if (!confirm(`${user.email} 계정을 강제 탈퇴 처리하시겠습니까?`)) return;
    }
    startTransition(async () => {
      const res = await adminUpdateUserStatus(user.id, status);
      if ("error" in res && res.error) alert(res.error);
    });
  };

  return (
    <tr className="border-t">
      <td className="px-3 py-2">{user.nickname}</td>
      <td className="px-3 py-2 text-slate-500">{user.email}</td>
      <td className="px-3 py-2 text-slate-500">{user.role.join(", ")}</td>
      <td className="px-3 py-2">
        <span
          className={
            "rounded-full px-2 py-0.5 text-xs " +
            (user.status === "ACTIVE"
              ? "bg-emerald-100 text-emerald-700"
              : user.status === "SUSPENDED"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-200 text-slate-600")
          }
        >
          {userStatusLabel(user.status)}
        </span>
      </td>
      <td className="px-3 py-2 text-slate-500">
        {user.createdAt.toISOString().slice(0, 10)}
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          {user.status !== "ACTIVE" && (
            <button
              className="rounded border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
              disabled={pending}
              onClick={() => apply("ACTIVE")}
            >
              활성화
            </button>
          )}
          {user.status === "ACTIVE" && (
            <button
              className="rounded border px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
              disabled={pending}
              onClick={() => apply("SUSPENDED")}
            >
              정지
            </button>
          )}
          {user.status !== "DELETED" && (
            <button
              className="rounded border px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
              disabled={pending}
              onClick={() => apply("DELETED")}
            >
              탈퇴
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
