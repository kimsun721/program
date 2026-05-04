"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tokenMissing = !token;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await resetPassword(token, fd);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setSuccess(res.success ?? "비밀번호가 변경되었습니다");
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">LinguaClass</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">비밀번호 재설정</CardTitle>
            <CardDescription>
              {tokenMissing
                ? "유효한 재설정 링크가 아닙니다."
                : "새 비밀번호를 입력하세요."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-700 mb-6">{success}</p>
                <Button onClick={() => router.push("/login")} className="w-full">
                  로그인으로 이동
                </Button>
              </div>
            ) : tokenMissing ? (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/forgot-password">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  재설정 메일 다시 받기
                </Link>
              </Button>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">새 비밀번호</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="8자 이상, 영문+숫자"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "변경 중..." : "비밀번호 변경"}
                </Button>

                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    로그인으로 돌아가기
                  </Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
