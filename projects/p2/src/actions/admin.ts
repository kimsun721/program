"use server";

import { prisma } from "@/lib/prisma";
import { assertRoleInAction } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function adminUpdateUserStatus(
  userId: string,
  status: "ACTIVE" | "SUSPENDED" | "DELETED"
) {
  const guard = await assertRoleInAction("ADMIN");
  if (!guard.ok) return { error: guard.error };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "사용자를 찾을 수 없습니다" };
  if (target.role.includes("ADMIN")) {
    return { error: "관리자 계정의 상태는 변경할 수 없습니다" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      deletedAt: status === "DELETED" ? new Date() : null,
    },
  });

  revalidatePath("/admin/users");
  return { success: "상태를 변경했습니다" };
}

export async function adminApproveInstructor(profileId: string) {
  const guard = await assertRoleInAction("ADMIN");
  if (!guard.ok) return { error: guard.error };

  const profile = await prisma.instructorProfile.findUnique({
    where: { id: profileId },
    include: { user: true },
  });
  if (!profile) return { error: "신청 정보를 찾을 수 없습니다" };
  if (profile.status !== "PENDING") {
    return { error: "이미 처리된 신청입니다" };
  }

  const newRoles = Array.from(new Set([...profile.user.role, "INSTRUCTOR"]));

  await prisma.$transaction([
    prisma.instructorProfile.update({
      where: { id: profileId },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    }),
    prisma.user.update({
      where: { id: profile.userId },
      data: { role: newRoles },
    }),
  ]);

  revalidatePath("/admin/instructor-applications");
  return { success: "강사 신청을 승인했습니다" };
}

export async function adminRejectInstructor(
  profileId: string,
  reason: string
) {
  const guard = await assertRoleInAction("ADMIN");
  if (!guard.ok) return { error: guard.error };

  if (!reason || reason.trim().length < 5) {
    return { error: "반려 사유를 5자 이상 입력해주세요" };
  }

  const profile = await prisma.instructorProfile.findUnique({
    where: { id: profileId },
  });
  if (!profile) return { error: "신청 정보를 찾을 수 없습니다" };
  if (profile.status !== "PENDING") {
    return { error: "이미 처리된 신청입니다" };
  }

  await prisma.instructorProfile.update({
    where: { id: profileId },
    data: {
      status: "REJECTED",
      rejectionReason: reason.trim(),
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/instructor-applications");
  return { success: "강사 신청을 반려했습니다" };
}

export async function adminApproveCourse(courseId: string) {
  const guard = await assertRoleInAction("ADMIN");
  if (!guard.ok) return { error: guard.error };

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "강의를 찾을 수 없습니다" };
  if (course.status !== "REVIEW") {
    return { error: "검토 중인 강의만 승인할 수 있습니다" };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "PUBLISHED",
      reviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  revalidatePath("/admin/course-approvals");
  return { success: "강의를 게시했습니다" };
}

export async function adminRejectCourse(courseId: string, reason: string) {
  const guard = await assertRoleInAction("ADMIN");
  if (!guard.ok) return { error: guard.error };

  if (!reason || reason.trim().length < 5) {
    return { error: "반려 사유를 5자 이상 입력해주세요" };
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "강의를 찾을 수 없습니다" };
  if (course.status !== "REVIEW") {
    return { error: "검토 중인 강의만 반려할 수 있습니다" };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "HIDDEN",
      rejectionReason: reason.trim(),
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/course-approvals");
  return { success: "강의를 반려했습니다" };
}

export async function adminUpsertCategory(formData: FormData) {
  const guard = await assertRoleInAction("ADMIN");
  if (!guard.ok) return { error: guard.error };

  const id = formData.get("id") as string | null;
  const name = ((formData.get("name") as string) ?? "").trim();
  const slug = ((formData.get("slug") as string) ?? "").trim();
  if (!name || !slug) return { error: "이름과 슬러그를 입력해주세요" };

  if (id) {
    await prisma.category.update({ where: { id }, data: { name, slug } });
  } else {
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists) return { error: "이미 사용 중인 슬러그입니다" };
    await prisma.category.create({ data: { name, slug } });
  }

  revalidatePath("/admin/taxonomy");
  return { success: "카테고리를 저장했습니다" };
}

export async function adminToggleCategory(id: string) {
  const guard = await assertRoleInAction("ADMIN");
  if (!guard.ok) return { error: guard.error };
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return { error: "카테고리를 찾을 수 없습니다" };
  await prisma.category.update({
    where: { id },
    data: { isActive: !cat.isActive },
  });
  revalidatePath("/admin/taxonomy");
  return { success: "상태를 변경했습니다" };
}

export async function adminToggleLanguage(id: string) {
  const guard = await assertRoleInAction("ADMIN");
  if (!guard.ok) return { error: guard.error };
  const lang = await prisma.language.findUnique({ where: { id } });
  if (!lang) return { error: "언어를 찾을 수 없습니다" };
  await prisma.language.update({
    where: { id },
    data: { isActive: !lang.isActive },
  });
  revalidatePath("/admin/taxonomy");
  return { success: "상태를 변경했습니다" };
}
