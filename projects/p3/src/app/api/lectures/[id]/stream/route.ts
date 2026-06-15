import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lectureId } = await params;

  // Get the lecture
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: {
      section: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  const courseId = lecture.section.course.id;

  // Allow free preview without enrollment
  if (!lecture.isFreePreview) {
    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment || enrollment.status === "REFUNDED") {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }
  }

  if (!lecture.hlsUrl) {
    return NextResponse.json(
      { error: "Stream not available" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    url: lecture.hlsUrl,
    lectureId: lecture.id,
    title: lecture.title,
    duration: lecture.duration,
  });
}
