"use server";

import { prisma } from "@/lib/prisma";
import { signIn, signOut, auth } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

const registerSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "비밀번호는 영문자와 숫자를 포함해야 합니다"
    ),
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(20, "닉네임은 20자 이하이어야 합니다"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    nickname: formData.get("nickname") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
    };
  }

  const { email, password, nickname } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "이미 사용 중인 이메일입니다" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nickname,
      role: ["STUDENT"],
      status: "ACTIVE",
    },
  });

  // Create verification token
  const token = uuidv4();
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      type: "SIGNUP",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  try {
    await sendVerificationEmail(email, token, "SIGNUP");
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  return {
    success:
      "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.",
  };
}

export async function verifyEmail(token: string) {
  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verification) {
    return { error: "유효하지 않은 인증 토큰입니다" };
  }

  if (verification.usedAt) {
    return { error: "이미 사용된 인증 토큰입니다" };
  }

  if (verification.expiresAt < new Date()) {
    return { error: "만료된 인증 토큰입니다" };
  }

  if (verification.type !== "SIGNUP") {
    return { error: "유효하지 않은 인증 유형입니다" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: "이메일 인증이 완료되었습니다. 로그인해주세요." };
}

export async function login(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "이메일과 비밀번호를 올바르게 입력해주세요" };
  }

  try {
    await signIn("credentials", {
      email: raw.email,
      password: raw.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": {
          const code = (error as AuthError & { code?: string }).code;
          if (code === "email_not_verified") {
            return { error: "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요." };
          }
          if (code === "account_inactive") {
            return { error: "비활성화된 계정입니다. 고객센터에 문의해주세요." };
          }
          return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
        }
        default:
          return { error: "로그인 중 오류가 발생했습니다" };
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirect: false });
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !z.string().email().safeParse(email).success) {
    return { error: "올바른 이메일 형식이 아닙니다" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Return success even if user doesn't exist (security)
  if (!user || user.deletedAt) {
    return {
      success:
        "이메일이 등록된 경우 비밀번호 재설정 링크를 발송했습니다.",
    };
  }

  const token = uuidv4();
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      type: "RESET_PW",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  try {
    await sendVerificationEmail(email, token, "RESET_PW");
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }

  return {
    success: "이메일이 등록된 경우 비밀번호 재설정 링크를 발송했습니다.",
  };
}

export async function resetPassword(token: string, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다" };
  }

  if (password !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다" };
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
  });

  if (!verification) {
    return { error: "유효하지 않은 토큰입니다" };
  }

  if (verification.usedAt) {
    return { error: "이미 사용된 토큰입니다" };
  }

  if (verification.expiresAt < new Date()) {
    return { error: "만료된 토큰입니다" };
  }

  if (verification.type !== "RESET_PW") {
    return { error: "유효하지 않은 토큰 유형입니다" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { password: hashedPassword },
    }),
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: "비밀번호가 변경되었습니다. 다시 로그인해주세요." };
}

export async function resendVerificationEmail(email: string) {
  if (!email || !z.string().email().safeParse(email).success) {
    return { error: "올바른 이메일 형식이 아닙니다" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.deletedAt) {
    return { success: "인증 메일을 발송했습니다." };
  }

  if (user.emailVerified) {
    return { error: "이미 인증된 이메일입니다" };
  }

  // 기존 미사용 토큰 만료 처리
  await prisma.emailVerification.updateMany({
    where: { userId: user.id, type: "SIGNUP", usedAt: null },
    data: { expiresAt: new Date() },
  });

  const token = uuidv4();
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      type: "SIGNUP",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  try {
    await sendVerificationEmail(email, token, "SIGNUP");
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return { error: "메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  return { success: "인증 메일을 발송했습니다." };
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "로그인이 필요합니다" };
  }

  const nickname = formData.get("nickname") as string;

  if (!nickname || nickname.length < 2) {
    return { error: "닉네임은 2자 이상이어야 합니다" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { nickname },
  });

  revalidatePath("/");
  return { success: "프로필이 업데이트되었습니다" };
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "로그인이 필요합니다" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "새 비밀번호는 8자 이상이어야 합니다" };
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
    return { error: "새 비밀번호는 영문자와 숫자를 포함해야 합니다" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "비밀번호 확인이 일치하지 않습니다" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user || !user.password) {
    return { error: "사용자를 찾을 수 없습니다" };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { error: "현재 비밀번호가 올바르지 않습니다" };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  return { success: "비밀번호가 변경되었습니다" };
}

export async function applyInstructor(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "로그인이 필요합니다" };
  }

  const realName = (formData.get("realName") as string | null)?.trim() ?? "";
  const headline = (formData.get("headline") as string | null)?.trim() ?? "";
  const description =
    (formData.get("description") as string | null)?.trim() ?? "";
  const career = (formData.get("career") as string | null)?.trim() ?? "";

  if (realName.length < 2) return { error: "실명을 입력해주세요" };
  if (headline.length < 2) return { error: "한 줄 소개를 입력해주세요" };
  if (description.length < 10)
    return { error: "자기소개를 10자 이상 작성해주세요" };
  if (career.length < 5) return { error: "경력을 5자 이상 작성해주세요" };

  const existing = await prisma.instructorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (existing) {
    if (existing.status === "PENDING") {
      return { error: "이미 신청한 내역이 검토 중입니다" };
    }
    if (existing.status === "APPROVED") {
      return { error: "이미 강사로 승인된 사용자입니다" };
    }
    // REJECTED → 재신청 허용 (PENDING으로 갱신)
    await prisma.instructorProfile.update({
      where: { id: existing.id },
      data: {
        realName,
        headline,
        description,
        career,
        status: "PENDING",
        rejectionReason: null,
        reviewedAt: null,
      },
    });
  } else {
    await prisma.instructorProfile.create({
      data: {
        userId: session.user.id,
        realName,
        headline,
        description,
        career,
        status: "PENDING",
      },
    });
  }

  revalidatePath("/become-instructor");
  return { success: "강사 신청이 접수되었습니다. 검토 후 알려드릴게요." };
}

export async function deleteAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "로그인이 필요합니다" };
  }

  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.password) {
    return { error: "사용자를 찾을 수 없습니다" };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { error: "비밀번호가 올바르지 않습니다" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { deletedAt: new Date(), status: "DELETED" },
  });

  await signOut({ redirect: false });
  return { success: true };
}
