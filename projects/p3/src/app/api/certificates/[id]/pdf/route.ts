import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { renderCertificatePdf } from "@/lib/certificate-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      user: { select: { nickname: true } },
      course: {
        select: {
          title: true,
          instructor: { select: { realName: true } },
        },
      },
    },
  });

  if (!cert || cert.userId !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const buffer = await renderCertificatePdf({
    studentName: cert.user.nickname,
    courseTitle: cert.course.title,
    instructorName: cert.course.instructor.realName,
    serialNo: cert.serialNo,
    issuedAt: cert.issuedAt,
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificate-${cert.serialNo}.pdf"`,
    },
  });
}
