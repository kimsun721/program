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

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    salt:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
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
