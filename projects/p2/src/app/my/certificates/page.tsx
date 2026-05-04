import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { IssueButton } from "./IssueButton";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/my/certificates");

  const [issued, eligible] = await Promise.all([
    prisma.certificate.findMany({
      where: { userId: session.user.id },
      orderBy: { issuedAt: "desc" },
      include: {
        course: { select: { id: true, title: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        progressPct: { gte: 100 },
        course: { certificates: { none: { userId: session.user.id } } },
      },
      include: { course: { select: { id: true, title: true } } },
    }),
  ]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">수료증</h1>
        <Link href="/my" className="text-sm text-blue-600 hover:underline">
          ← 내 강의로
        </Link>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-700">발급 가능</h2>
        <div className="mt-2 space-y-2">
          {eligible.length === 0 && (
            <p className="rounded-md border bg-slate-50 p-4 text-sm text-slate-500">
              진도 100% 달성한 강의가 없습니다.
            </p>
          )}
          {eligible.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-md border bg-emerald-50 p-3"
            >
              <div className="text-sm font-medium">{e.course.title}</div>
              <IssueButton courseId={e.course.id} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">발급된 수료증</h2>
        <div className="mt-2 space-y-2">
          {issued.length === 0 && (
            <p className="rounded-md border bg-slate-50 p-4 text-sm text-slate-500">
              아직 발급된 수료증이 없습니다.
            </p>
          )}
          {issued.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border bg-white p-3"
            >
              <div>
                <div className="text-sm font-semibold">{c.course.title}</div>
                <div className="text-xs text-slate-500">
                  발급일{" "}
                  {c.issuedAt.toISOString().slice(0, 10)} · S/N {c.serialNo}
                </div>
              </div>
              <a
                href={`/api/certificates/${c.id}/pdf`}
                target="_blank"
                rel="noopener"
                className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
              >
                PDF 다운로드
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
