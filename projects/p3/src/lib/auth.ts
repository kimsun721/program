import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

class AccountInactiveError extends CredentialsSignin {
  code = "account_inactive";
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  // self-hosted(공개 IP/도메인) 배포에서 Host 헤더를 신뢰해야 세션이 동작.
  // 미설정 시 localhost 외 호스트에서 auth()가 실패해 보호 페이지가 로그인으로 튕긴다.
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password || user.deletedAt) {
          throw new InvalidCredentialsError();
        }
        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }
        if (user.status !== "ACTIVE") {
          throw new AccountInactiveError();
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new InvalidCredentialsError();

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          image: user.profileImage,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // 1) 로그인 직후 — Credentials authorize() 결과를 토큰에 박는다
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string[] }).role ?? ["STUDENT"];
        token.roleSyncedAt = Date.now();
        return token;
      }

      // 2) 이후 매 요청 — 일정 간격으로 DB의 role/status를 다시 읽어와 동기화.
      //    승급(강사 승인) 즉시 INSTRUCTOR 메뉴가 열리고, 정지/탈퇴 시 세션이 끊긴다.
      const SYNC_INTERVAL_MS = 10_000; // 10초마다 1회 갱신 (오래 머무는 페이지에서 라운드트립 부담 ↓)
      const lastSync = (token.roleSyncedAt as number | undefined) ?? 0;
      const stale = Date.now() - lastSync > SYNC_INTERVAL_MS;

      if (token.id && (trigger === "update" || stale)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true, deletedAt: true },
        });

        if (!dbUser || dbUser.deletedAt || dbUser.status !== "ACTIVE") {
          // 계정이 사라졌거나 정지·탈퇴 → null 반환으로 세션 무효화
          return null;
        }

        token.role = dbUser.role;
        token.roleSyncedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string[];
      }
      return session;
    },
  },
});
