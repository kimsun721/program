import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">LinguaClass</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              외국어 학습의 새로운 방법을 경험하세요. 전문 강사들의 체계적인
              커리큘럼으로 효율적으로 언어를 배울 수 있습니다.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/courses"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  강의 목록
                </Link>
              </li>
              <li>
                <Link
                  href="/my"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  내 강의
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  찜 목록
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">지원</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  자주 묻는 질문
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  이용약관
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <p className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} LinguaClass. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
