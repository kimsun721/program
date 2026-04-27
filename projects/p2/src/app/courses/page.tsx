import { Suspense } from "react";
import { getCourses, getLanguages, getCategories } from "@/actions/courses";
import CourseList from "@/components/course/CourseList";
import CourseFilter from "@/components/course/CourseFilter";
import type { CourseFilters, CourseLevel } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "강의 목록",
  description: "다양한 외국어 강의를 찾아보세요.",
};

interface CoursesPageProps {
  searchParams: Promise<{
    languageId?: string;
    categoryId?: string;
    level?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

async function CourseListSection({ searchParams }: { searchParams: Awaited<CoursesPageProps["searchParams"]> }) {
  const filters: CourseFilters = {
    languageId: searchParams.languageId,
    categoryId: searchParams.categoryId,
    level: searchParams.level as CourseLevel | undefined,
    search: searchParams.search,
    sort: (searchParams.sort as CourseFilters["sort"]) || "newest",
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 12,
  };

  const { courses, total, page, totalPages } = await getCourses(filters);

  return (
    <CourseList
      courses={courses}
      total={total}
      page={page}
      totalPages={totalPages}
    />
  );
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const [languages, categories, params] = await Promise.all([
    getLanguages(),
    getCategories(),
    searchParams,
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">강의 목록</h1>
        <p className="text-gray-500">원하는 언어를 선택하고 학습을 시작하세요.</p>
      </div>

      <div className="mb-8">
        <CourseFilter languages={languages} categories={categories} />
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl aspect-video animate-pulse"
              />
            ))}
          </div>
        }
      >
        <CourseListSection searchParams={params} />
      </Suspense>
    </div>
  );
}
