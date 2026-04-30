import { prisma } from "@/lib/prisma";
import { TaxonomyPanels } from "./TaxonomyPanels";

export const dynamic = "force-dynamic";

export default async function TaxonomyPage() {
  const [categories, languages] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.language.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">카테고리·언어</h1>
      <p className="mt-1 text-sm text-slate-600">
        강의 분류에 사용하는 카테고리/언어 마스터를 관리합니다.
      </p>
      <div className="mt-4">
        <TaxonomyPanels categories={categories} languages={languages} />
      </div>
    </div>
  );
}
