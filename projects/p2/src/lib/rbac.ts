import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (!user.role?.includes(role)) {
    redirect("/403");
  }
  return user;
}

export async function requireAnyRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.some((r) => user.role?.includes(r))) {
    redirect("/403");
  }
  return user;
}

export function hasRole(roles: string[] | undefined, role: Role): boolean {
  return !!roles?.includes(role);
}

export async function assertRoleInAction(role: Role) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "로그인이 필요합니다" };
  }
  if (!session.user.role?.includes(role)) {
    return { ok: false as const, error: "권한이 없습니다" };
  }
  return { ok: true as const, user: session.user };
}
