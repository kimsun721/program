import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function InstructorDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.instructorProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    return <div className="text-sm text-slate-500">강사 프로필이 없습니다.</div>;
  }

  const [courses, totalEnrollments, ratingAgg, unansweredQna] = await Promise.all([
    prisma.course.findMany({
      where: { instructorId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        enrollmentCount: true,
        avgRating: true,
        reviewCount: true,
      },
    }),
    prisma.enrollment.count({
      where: { course: { instructorId: profile.id } },
    }),
    prisma.review.aggregate({
      where: { course: { instructorId: profile.id } },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.qnaQuestion.count({
      where: {
        course: { instructorId: profile.id },
        status: "OPEN",
      },
    }),
  ]);

  const courseCount = await prisma.course.count({
    where: { instructorId: profile.id },
  });

  const kpis = [
    { label: "총 강의 수", value: courseCount },
    { label: "총 수강생", value: totalEnrollments },
    {
      label: "평균 평점",
      value: ratingAgg._avg.rating ? ratingAgg._avg.rating.toFixed(2) : "—",
    },
    {
      label: "미답 Q&A",
      value: unansweredQna,
      accent: unansweredQna > 0,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">강사 대시보드</h1>
      <p className="mt-1 text-sm text-slate-600">
        안녕하세요, {profile.realName}님. 본인 강의 운영 현황을 확인하세요.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={
              "rounded-lg border p-4 " +
              (k.accent ? "border-amber-300 bg-amber-50" : "bg-slate-50")
            }
          >
            <div className="text-xs text-slate-500">{k.label}</div>
            <div className="mt-1 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">최근 강의</h2>
          <Link
            href="/instructor/courses"
            className="text-sm text-blue-600 hover:underline"
          >
            전체 보기
          </Link>
        </div>
        <div className="mt-2 rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">제목</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">수강생</th>
                <th className="px-3 py-2">평점</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                    아직 등록한 강의가 없습니다.
                  </td>
                </tr>
              )}
              {courses.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">
                    <Link
                      href={`/instructor/courses/${c.id}`}
                      className="hover:underline"
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{c.status}</td>
                  <td className="px-3 py-2">{c.enrollmentCount}</td>
                  <td className="px-3 py-2">
                    {c.reviewCount > 0
                      ? `${c.avgRating.toFixed(2)} (${c.reviewCount})`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
