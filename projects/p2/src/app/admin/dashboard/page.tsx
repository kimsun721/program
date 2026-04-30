import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    userCount,
    instructorCount,
    pendingInstructorCount,
    courseCount,
    publishedCourseCount,
    pendingCourseCount,
    enrollmentCount,
    avgRating,
    recentUsers,
    recentCourses,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.instructorProfile.count({ where: { status: "APPROVED" } }),
    prisma.instructorProfile.count({ where: { status: "PENDING" } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.course.count({ where: { status: "REVIEW" } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, nickname: true, email: true, role: true, createdAt: true },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        instructor: { select: { realName: true } },
      },
    }),
  ]);

  const kpis = [
    { label: "전체 회원", value: userCount },
    { label: "활동 강사", value: instructorCount },
    { label: "강사 신청 대기", value: pendingInstructorCount, accent: pendingInstructorCount > 0 },
    { label: "전체 강의", value: courseCount },
    { label: "게시된 강의", value: publishedCourseCount },
    { label: "강의 승인 대기", value: pendingCourseCount, accent: pendingCourseCount > 0 },
    { label: "수강 중인 건수", value: enrollmentCount },
    {
      label: "평균 평점",
      value: avgRating._avg.rating ? avgRating._avg.rating.toFixed(2) : "—",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">운영 대시보드</h1>
      <p className="mt-1 text-sm text-slate-600">
        플랫폼 핵심 지표와 최근 활동을 한눈에 확인합니다.
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

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold">최근 가입 회원</h2>
          <div className="mt-2 rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2">닉네임</th>
                  <th className="px-3 py-2">이메일</th>
                  <th className="px-3 py-2">역할</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2">{u.nickname}</td>
                    <td className="px-3 py-2 text-slate-500">{u.email}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {u.role.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold">최근 등록 강의</h2>
          <div className="mt-2 rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2">제목</th>
                  <th className="px-3 py-2">강사</th>
                  <th className="px-3 py-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {recentCourses.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.title}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {c.instructor.realName}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
