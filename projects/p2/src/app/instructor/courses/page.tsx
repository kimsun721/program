import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function InstructorCoursesPage() {
  const session = await auth();
  const profile = await prisma.instructorProfile.findUnique({
    where: { userId: session!.user.id },
  });
  if (!profile) return null;

  const courses = await prisma.course.findMany({
    where: { instructorId: profile.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      enrollmentCount: true,
      avgRating: true,
      reviewCount: true,
      rejectionReason: true,
      updatedAt: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 강의</h1>
          <p className="mt-1 text-sm text-slate-600">
            본인이 등록한 강의를 관리합니다.
          </p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          + 새 강의
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {courses.length === 0 && (
          <p className="rounded-md border bg-slate-50 p-6 text-center text-sm text-slate-500">
            등록한 강의가 없습니다.
          </p>
        )}
        {courses.map((c) => (
          <div key={c.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/instructor/courses/${c.id}`}
                  className="text-base font-semibold hover:underline"
                >
                  {c.title}
                </Link>
                <div className="mt-1 text-xs text-slate-500">
                  slug: {c.slug} · 수강생 {c.enrollmentCount}명
                  {c.reviewCount > 0 &&
                    ` · 평점 ${c.avgRating.toFixed(2)} (${c.reviewCount})`}
                </div>
                {c.status === "HIDDEN" && c.rejectionReason && (
                  <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                    반려: {c.rejectionReason}
                  </div>
                )}
              </div>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs " +
                  (c.status === "PUBLISHED"
                    ? "bg-emerald-100 text-emerald-700"
                    : c.status === "REVIEW"
                      ? "bg-amber-100 text-amber-700"
                      : c.status === "HIDDEN"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-200 text-slate-600")
                }
              >
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
