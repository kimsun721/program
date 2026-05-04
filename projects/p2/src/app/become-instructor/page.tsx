import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApplyInstructorForm } from "./ApplyInstructorForm";

export const dynamic = "force-dynamic";

export default async function BecomeInstructorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/become-instructor");

  const profile = await prisma.instructorProfile.findUnique({
    where: { userId: session.user.id },
  });

  const alreadyInstructor = session.user.role?.includes("INSTRUCTOR");

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-bold">강사 신청</h1>
      <p className="mt-2 text-slate-600">
        강의 등록·운영 권한을 얻으려면 아래 정보를 입력해 신청해주세요. 관리자
        승인 후 강사 권한이 활성화됩니다.
      </p>

      {alreadyInstructor && (
        <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          이미 강사로 승인되었습니다.{" "}
          <a href="/instructor/dashboard" className="underline">
            강사 대시보드로 이동
          </a>
        </div>
      )}

      {!alreadyInstructor && profile?.status === "PENDING" && (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          신청이 접수되었습니다. 관리자 검토를 기다려 주세요.
        </div>
      )}

      {!alreadyInstructor && profile?.status === "REJECTED" && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          이전 신청이 반려되었습니다. 사유: {profile.rejectionReason ?? "—"}.
          내용을 보완해 다시 신청할 수 있습니다.
        </div>
      )}

      {!alreadyInstructor && (
        <div className="mt-6">
          <ApplyInstructorForm
            defaultValues={
              profile
                ? {
                    realName: profile.realName,
                    headline: profile.headline,
                    description: profile.description,
                    career: profile.career,
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
