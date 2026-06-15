import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCourse } from "@/actions/courses";
import { getReviews } from "@/actions/reviews";
import { getEnrollment } from "@/actions/enrollments";
import { isWishlisted } from "@/actions/wishlist";
import { CourseQnaSection } from "./CourseQnaSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Lock,
  PlayCircle,
  ChevronDown,
} from "lucide-react";
import { formatPrice, getLevelLabel, formatDuration, formatDate } from "@/lib/utils";
import EnrollButton from "./EnrollButton";
import WishlistButton from "./WishlistButton";
import ReviewSection from "./ReviewSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) return { title: "강의를 찾을 수 없습니다" };
  return {
    title: course.title,
    description: course.description.slice(0, 160),
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [course, session] = await Promise.all([getCourse(id), auth()]);

  if (!course) notFound();

  const [reviews, enrollment, wishlisted, qnaQuestions] = await Promise.all([
    getReviews(id),
    session?.user ? getEnrollment(id) : null,
    session?.user ? isWishlisted(id) : false,
    prisma.qnaQuestion.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: { select: { id: true, nickname: true } },
        lecture: { select: { id: true, title: true } },
        answers: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { nickname: true } } },
        },
      },
    }),
  ]);

  const totalLectures = course.sections.reduce(
    (acc, s) => acc + s.lectures.length,
    0
  );
  const totalDuration = course.sections.reduce(
    (acc, s) =>
      acc + s.lectures.reduce((lacc, l) => lacc + l.duration, 0),
    0
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex gap-2 mb-4">
                <Badge className="bg-blue-500">{course.language.nameKo}</Badge>
                <Badge variant="secondary" className="bg-gray-700 text-white">
                  {course.category.name}
                </Badge>
                <Badge variant="secondary" className="bg-gray-700 text-white">
                  {getLevelLabel(course.level)}
                </Badge>
              </div>

              <h1 className="text-3xl font-bold mb-4 leading-tight">
                {course.title}
              </h1>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                {course.description.slice(0, 200)}
                {course.description.length > 200 ? "..." : ""}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-white">
                    {course.avgRating.toFixed(1)}
                  </span>
                  <span>({course.reviewCount}개 리뷰)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>수강생 {course.enrollmentCount.toLocaleString()}명</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>강의 {totalLectures}개</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>총 {formatDuration(totalDuration)}</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-400">
                강사:{" "}
                <span className="text-white font-medium">
                  {course.instructor.realName}
                </span>
              </div>
            </div>

            {/* Course Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl overflow-hidden shadow-xl text-gray-900 sticky top-20">
                {course.thumbnail ? (
                  <div className="relative aspect-video">
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-gray-400" />
                  </div>
                )}

                <div className="p-6">
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    {formatPrice(course.price)}
                  </div>

                  {enrollment ? (
                    <Button className="w-full mb-3" size="lg" asChild>
                      <Link href={`/my/${course.id}/learn`}>
                        <PlayCircle className="h-5 w-5 mr-2" />
                        계속 수강하기
                      </Link>
                    </Button>
                  ) : (
                    <EnrollButton
                      courseId={course.id}
                      courseTitle={course.title}
                      price={course.price}
                      isLoggedIn={!!session?.user}
                    />
                  )}

                  <WishlistButton
                    courseId={course.id}
                    initialWishlisted={wishlisted}
                    isLoggedIn={!!session?.user}
                  />

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>총 수강 시간: {formatDuration(totalDuration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>강의 수: {totalLectures}개</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="curriculum">
              <TabsList className="mb-6">
                <TabsTrigger value="curriculum">커리큘럼</TabsTrigger>
                <TabsTrigger value="instructor">강사 소개</TabsTrigger>
                <TabsTrigger value="reviews">
                  리뷰 ({course.reviewCount})
                </TabsTrigger>
                <TabsTrigger value="qna">
                  Q&amp;A ({qnaQuestions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum">
                <div className="space-y-4">
                  <div className="text-sm text-gray-500 mb-4">
                    총 {course.sections.length}개 섹션 · {totalLectures}개 강의 ·{" "}
                    {formatDuration(totalDuration)}
                  </div>
                  {course.sections.map((section) => (
                    <div
                      key={section.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {section.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {section.lectures.length}개 강의
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {section.lectures.map((lecture) => (
                          <div
                            key={lecture.id}
                            className="flex items-center gap-3 px-4 py-3"
                          >
                            {lecture.isFreePreview ? (
                              <PlayCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="text-sm text-gray-700 flex-1">
                              {lecture.title}
                            </span>
                            {lecture.isFreePreview && (
                              <Badge
                                variant="outline"
                                className="text-xs text-blue-600 border-blue-200 flex-shrink-0"
                              >
                                미리보기
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatDuration(lecture.duration)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="instructor">
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarImage
                      src={course.instructor.user.profileImage || undefined}
                    />
                    <AvatarFallback className="text-xl">
                      {course.instructor.realName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {course.instructor.realName}
                    </h3>
                    <p className="text-gray-600">{course.instructor.headline}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {course.instructor.description}
                  </p>
                </div>

                <Separator className="my-6" />

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">경력</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {course.instructor.career}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <ReviewSection
                  courseId={course.id}
                  reviews={reviews}
                  avgRating={course.avgRating}
                  isEnrolled={!!enrollment}
                  isLoggedIn={!!session?.user}
                  currentUserId={session?.user?.id}
                />
              </TabsContent>

              <TabsContent value="qna">
                <CourseQnaSection
                  courseId={course.id}
                  isEnrolled={!!enrollment}
                  lectures={course.sections.flatMap((s) =>
                    s.lectures.map((l) => ({ id: l.id, title: l.title }))
                  )}
                  questions={qnaQuestions.map((q) => ({
                    id: q.id,
                    title: q.title,
                    content: q.content,
                    status: q.status,
                    createdAt: q.createdAt,
                    user: { id: q.user.id, nickname: q.user.nickname },
                    lecture: q.lecture
                      ? { id: q.lecture.id, title: q.lecture.title }
                      : null,
                    answers: q.answers.map((a) => ({
                      id: a.id,
                      content: a.content,
                      createdAt: a.createdAt,
                      user: { nickname: a.user.nickname },
                    })),
                  }))}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Description sidebar */}
          <div className="hidden lg:block">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">이 강의에 대하여</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {course.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
