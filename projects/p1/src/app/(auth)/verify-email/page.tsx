import { verifyEmail } from "@/actions/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, BookOpen } from "lucide-react";

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            유효하지 않은 링크
          </h2>
          <p className="text-gray-600 mb-6">
            인증 토큰이 없습니다. 올바른 링크인지 확인해주세요.
          </p>
          <Button asChild>
            <Link href="/">홈으로 가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  const result = await verifyEmail(token);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">LinguaClass</span>
        </Link>

        {result.success ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              이메일 인증 완료!
            </h2>
            <p className="text-gray-600 mb-6">{result.success}</p>
            <Button asChild>
              <Link href="/login">로그인하기</Link>
            </Button>
          </>
        ) : (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              인증 실패
            </h2>
            <p className="text-gray-600 mb-6">{result.error}</p>
            <Button asChild>
              <Link href="/register">다시 가입하기</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
