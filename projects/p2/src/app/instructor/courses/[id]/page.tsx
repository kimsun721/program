import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CourseForm } from "../CourseForm";
import { CurriculumEditor } from "./CurriculumEditor";
import { CourseStatusActions } from "./CourseStatusActions";
import { courseStatusLabel } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function InstructorCourseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const profile = await prisma.instructorProfile.findUnique({
    where: { userId: session!.user.id },
  });
  if (!profile) notFound();

  const course = await prisma.course.findFirst({
    where: { id, instructorId: profile.id },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          lectures: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!course) notFound();

  const [languages, categories] = await Promise.all([
    prisma.language.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            상태: <strong>{courseStatusLabel(course.status)}</strong>
          </p>
          {course.status === "HIDDEN" && course.rejectionReason && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              반려 사유: {course.rejectionReason}
            </div>
          )}
        </div>
        <CourseStatusActions
          courseId={course.id}
          status={course.status}
          canSubmit={course.sections.length > 0}
        />
      </div>

      <section>
        <h2 className="text-lg font-semibold">기본 정보</h2>
        <div className="mt-3">
          <CourseForm
            mode="edit"
            courseId={course.id}
            defaultValues={{
              title: course.title,
              slug: course.slug,
              description: course.description,
              thumbnail: course.thumbnail,
              level: course.level,
              price: course.price,
              languageId: course.languageId,
              categoryId: course.categoryId,
            }}
            languages={languages}
            categories={categories}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">커리큘럼</h2>
        <div className="mt-3">
          <CurriculumEditor
            courseId={course.id}
            sections={course.sections.map((s) => ({
              id: s.id,
              title: s.title,
              sortOrder: s.sortOrder,
              lectures: s.lectures.map((l) => ({
                id: l.id,
                title: l.title,
                hlsUrl: l.hlsUrl,
                duration: l.duration,
                isFreePreview: l.isFreePreview,
                sortOrder: l.sortOrder,
              })),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
