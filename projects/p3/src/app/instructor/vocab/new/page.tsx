import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import NewVocabBookForm from "./NewVocabBookForm";

export default async function NewVocabBookPage() {
  const user = await requireRole("INSTRUCTOR");
  const courses = await prisma.course.findMany({
    where: { instructor: { userId: user.id }, status: "PUBLISHED" },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return <NewVocabBookForm courses={courses} />;
}
