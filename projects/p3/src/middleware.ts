import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PREFIX = "/admin";
const INSTRUCTOR_PREFIX = "/instructor";
const STUDENT_PREFIXES = ["/my", "/become-instructor"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAdmin = pathname.startsWith(ADMIN_PREFIX);
  const needsInstructor = pathname.startsWith(INSTRUCTOR_PREFIX);
  const needsLogin = STUDENT_PREFIXES.some((p) => pathname.startsWith(p));

  if (!needsAdmin && !needsInstructor && !needsLogin) {
    return NextResponse.next();
  }

  // 쿠키 이름/보안여부는 NODE_ENV 가 아니라 실제 HTTPS 여부로 판단해야 한다.
  // 프로덕션이라도 HTTP 로 서비스하면 NextAuth 는 비보안 쿠키(authjs.session-token)를 쓰므로
  // __Secure- 접두사를 강제하면 미들웨어가 토큰을 못 읽어 보호 페이지가 전부 로그인으로 튕긴다.
  const isHttps = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith("https://");
  const cookieName = isHttps
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: isHttps,
    salt: cookieName,
  });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const roles = (token.role as string[] | undefined) ?? [];

  if (needsAdmin && !roles.includes("ADMIN")) {
    return NextResponse.redirect(new URL("/403", req.url));
  }
  if (needsInstructor && !roles.includes("INSTRUCTOR")) {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/instructor/:path*", "/my/:path*", "/become-instructor/:path*"],
};
