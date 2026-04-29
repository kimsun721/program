"use client";

import { useState, useTransition } from "react";
import { applyInstructor } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  defaultValues?: {
    realName: string;
    headline: string;
    description: string;
    career: string;
  };
};

export function ApplyInstructorForm({ defaultValues }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const res = await applyInstructor(fd);
          if ("error" in res) setError(res.error ?? null);
          else setSuccess(res.success ?? null);
        });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="realName">실명</Label>
        <Input
          id="realName"
          name="realName"
          defaultValue={defaultValues?.realName}
          required
        />
      </div>
      <div>
        <Label htmlFor="headline">한 줄 소개</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={defaultValues?.headline}
          placeholder="예) 7년 경력 영어 회화 전문 강사"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">자기소개 (30자 이상)</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={defaultValues?.description}
          required
        />
      </div>
      <div>
        <Label htmlFor="career">경력</Label>
        <Textarea
          id="career"
          name="career"
          rows={4}
          defaultValue={defaultValues?.career}
          placeholder="학력·경력·자격증 등"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "제출 중..." : "신청하기"}
      </Button>
    </form>
  );
}
