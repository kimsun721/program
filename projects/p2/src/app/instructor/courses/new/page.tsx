import { prisma } from "@/lib/prisma";
import { CourseForm } from "../CourseForm";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const [languages, categories] = await Promise.all([
    prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">새 강의 만들기</h1>
      <p className="mt-1 text-sm text-slate-600">
        강의 기본 정보를 입력합니다. 섹션·차시는 생성 후 추가할 수 있습니다.
      </p>
      <div className="mt-6">
        <CourseForm mode="create" languages={languages} categories={categories} />
      </div>
    </div>
  );
}
