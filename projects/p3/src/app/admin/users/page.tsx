import { prisma } from "@/lib/prisma";
import { UserRow } from "./UserRow";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; status?: string };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status ?? "";

  const users = await prisma.user.findMany({
    where: {
      AND: [
        status ? { status } : {},
        q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { nickname: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">회원 관리</h1>
      <p className="mt-1 text-sm text-slate-600">
        회원을 검색하고, 정지·해제·강제 탈퇴할 수 있습니다.
      </p>

      <form className="mt-4 flex gap-2" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="이메일/닉네임 검색"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="DELETED">DELETED</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          검색
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-600">
            <tr>
              <th className="px-3 py-2">닉네임</th>
              <th className="px-3 py-2">이메일</th>
              <th className="px-3 py-2">역할</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">가입일</th>
              <th className="px-3 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  결과가 없습니다
                </td>
              </tr>
            )}
            {users.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
