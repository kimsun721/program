"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { register, resendVerificationEmail } from "@/actions/auth";
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
import { BookOpen, Eye, EyeOff, Mail } from "lucide-react";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendPending, startResendTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await register(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setRegisteredEmail(formData.get("email") as string);
      }
    });
  };

  const handleResend = () => {
    if (!registeredEmail) return;
    setResendStatus(null);
    startResendTransition(async () => {
      const result = await resendVerificationEmail(registeredEmail);
      setResendStatus(result.success ?? result.error ?? null);
    });
  };

  if (registeredEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                인증 메일을 확인해주세요
              </h2>
              <p className="text-gray-600 mb-1">아래 주소로 인증 메일을 보냈습니다.</p>
              <p className="text-blue-600 font-semibold mb-4">{registeredEmail}</p>
              <p className="text-sm text-gray-500 mb-6">
                메일함에서 &quot;이메일 인증&quot; 버튼을 클릭하면 가입이 완료됩니다.
                <br />
                스팸함도 확인해보세요.
              </p>
              {resendStatus && (
                <p className="text-sm text-green-600 mb-3">{resendStatus}</p>
              )}
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resendPending}
                className="w-full"
              >
                {resendPending ? "발송 중..." : "인증 메일 다시 보내기"}
              </Button>
              <p className="mt-4 text-sm text-gray-500">
                이미 인증했다면{" "}
                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <CardDescription>
              계정을 만들고 외국어 학습을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  placeholder="닉네임을 입력하세요 (2-20자)"
                  required
                  minLength={2}
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호 (8자 이상, 영문+숫자)"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "처리 중..." : "회원가입"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/login"
                className="text-blue-600 font-medium hover:underline"
              >
                로그인
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
