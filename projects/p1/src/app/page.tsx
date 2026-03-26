import Link from "next/link";
import { getCourses, getLanguages, getCategories } from "@/actions/courses";
import CourseCard from "@/components/course/CourseCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Star } from "lucide-react";

export default async function HomePage() {
  const [{ courses }, languages, categories] = await Promise.all([
    getCourses({ limit: 6, sort: "popular" }),
    getLanguages(),
    getCategories(),
  ]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            외국어 학습의 새로운 방법
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
            전문 강사들의 체계적인 커리큘럼으로
            <br className="hidden md:block" />
            효율적으로 언어를 배우세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
              asChild
            >
              <Link href="/courses">
                강의 둘러보기
                <ArrowRight className="h-5 w-5 ml-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600"
              asChild
            >
              <Link href="/register">무료로 시작하기</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-200" />
              <div className="text-left">
                <div className="text-2xl font-bold">100+</div>
                <div className="text-blue-200 text-sm">강의</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-200" />
              <div className="text-left">
                <div className="text-2xl font-bold">5,000+</div>
                <div className="text-blue-200 text-sm">수강생</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-blue-200" />
              <div className="text-left">
                <div className="text-2xl font-bold">4.8</div>
                <div className="text-blue-200 text-sm">평균 평점</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            배울 수 있는 언어
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {languages.map((lang) => (
              <Link
                key={lang.id}
                href={`/courses?languageId=${lang.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all font-medium text-gray-700 hover:text-blue-600"
              >
                <span className="text-xl">
                  {lang.code === "en"
                    ? "🇺🇸"
                    : lang.code === "ja"
                    ? "🇯🇵"
                    : lang.code === "zh"
                    ? "🇨🇳"
                    : lang.code === "es"
                    ? "🇪🇸"
                    : lang.code === "fr"
                    ? "🇫🇷"
                    : "🌍"}
                </span>
                {lang.nameKo}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            학습 카테고리
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/courses?categoryId=${cat.id}`}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <span className="text-3xl mb-3">
                  {cat.slug === "conversation"
                    ? "💬"
                    : cat.slug === "grammar"
                    ? "📝"
                    : cat.slug === "reading"
                    ? "📖"
                    : cat.slug === "listening"
                    ? "🎧"
                    : "💼"}
                </span>
                <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">인기 강의</h2>
            <Button variant="ghost" asChild>
              <Link href="/courses" className="flex items-center gap-1">
                전체 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            무료로 회원가입하고 다양한 강의를 만나보세요.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            asChild
          >
            <Link href="/register">무료 회원가입</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
