import { prisma } from "@/lib/prisma";
import { ApplicationCard } from "./ApplicationCard";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

export default async function InstructorApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "PENDING";

  const apps = await prisma.instructorProfile.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, nickname: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">강사 신청 관리</h1>
      <p className="mt-1 text-sm text-slate-600">
        신청서를 검토하고 승인하거나 사유와 함께 반려합니다.
      </p>

      <div className="mt-4 flex gap-2 text-sm">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
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
        {apps.length === 0 && (
          <p className="rounded-md border bg-slate-50 p-4 text-sm text-slate-500">
            해당 상태의 신청이 없습니다.
          </p>
        )}
        {apps.map((a) => (
          <ApplicationCard key={a.id} app={a} />
        ))}
      </div>
    </div>
  );
}
