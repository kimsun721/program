import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/my/account");

  return (
    <div className="container mx-auto max-w-xl py-10">
      <h1 className="text-2xl font-bold">계정 관리</h1>
      <p className="mt-2 text-slate-600">
        비밀번호와 같은 보안 정보를 관리합니다.
      </p>
      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">비밀번호 변경</h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
