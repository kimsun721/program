"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const res = await changePassword(fd);
          if ("error" in res) setError(res.error ?? null);
          else setSuccess(res.success ?? null);
        });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="currentPassword">현재 비밀번호</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div>
        <Label htmlFor="newPassword">새 비밀번호</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>
      <div>
        <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </form>
  );
}
