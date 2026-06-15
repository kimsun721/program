import { prisma } from "@/lib/prisma";
import { CourseApprovalRow } from "./CourseApprovalRow";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

export default async function CourseApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "REVIEW";

  const courses = await prisma.course.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: {
      instructor: {
        select: {
          realName: true,
          user: { select: { email: true } },
        },
      },
      language: { select: { nameKo: true } },
      category: { select: { name: true } },
      _count: { select: { sections: true } },
    },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">강의 승인 관리</h1>
      <p className="mt-1 text-sm text-slate-600">
        강사가 게시 요청한 강의를 검토하고 승인하거나 반려합니다.
      </p>

      <div className="mt-4 flex gap-2 text-sm">
        {["REVIEW", "PUBLISHED", "HIDDEN", "DRAFT", "ALL"].map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={
              "rounded-md border px-3 py-1.5 " +
              (status === s ? "bg-slate-900 text-white" : "bg-white")
            }
          >
            {s}
          </a>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {courses.length === 0 && (
          <p className="rounded-md border bg-slate-50 p-4 text-sm text-slate-500">
            해당 상태의 강의가 없습니다.
          </p>
        )}
        {courses.map((c) => (
          <CourseApprovalRow
            key={c.id}
            course={{
              id: c.id,
              title: c.title,
              status: c.status,
              level: c.level,
              price: c.price,
              languageName: c.language.nameKo,
              categoryName: c.category.name,
              sectionsCount: c._count.sections,
              instructorName: c.instructor.realName,
              instructorEmail: c.instructor.user.email,
              rejectionReason: c.rejectionReason,
              slug: c.slug,
            }}
          />
        ))}
      </div>
    </div>
  );
}
