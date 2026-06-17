import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEnrollment } from "@/actions/enrollments";
import { getCourse } from "@/actions/courses";
import Link from "next/link";
import VideoPlayer from "@/components/player/VideoPlayer";
import LectureNavigation from "./LectureNavigation";
import LectureControls from "./LectureControls";
import { LectureNoteWidget } from "./LectureNoteWidget";
import { formatDuration } from "@/lib/utils";
import { Lock, CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  if (!course) return { title: "강의를 찾을 수 없습니다" };
  return { title: `수강: ${course.title}` };
}

interface LearnPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lectureId?: string }>;
}

export default async function LearnPage({ params, searchParams }: LearnPageProps) {
  const session = await auth();
  if (!session?.user) {
    const { courseId } = await params;
    redirect(`/login?callbackUrl=/my/${courseId}/learn`);
  }

  const { courseId } = await params;
  const { lectureId: qLectureId } = await searchParams;

  const [enrollment, course] = await Promise.all([
    getEnrollment(courseId),
    getCourse(courseId),
  ]);

  if (!enrollment || !course) {
    notFound();
  }

  // Find the first lecture or the specified lecture
  const allLectures = course.sections.flatMap((s) =>
    s.lectures.map((l) => ({ ...l, sectionTitle: s.title }))
  );

  // 차시가 한 개도 없는 강의 — 빈 학습 페이지 대신 안내 화면을 보여준다.
  if (allLectures.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-xl bg-gray-800 p-8 text-center text-white">
          <div className="text-5xl">🎬</div>
          <h1 className="mt-4 text-2xl font-bold">{course.title}</h1>
          <p className="mt-2 text-gray-300">
            아직 강사가 차시를 등록하지 않았습니다. 콘텐츠가 추가되면 이 페이지에서 바로 수강할 수 있습니다.
          </p>
          <Link
            href="/my"
            className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium"
          >
            내 강의로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const currentIdx = qLectureId
    ? allLectures.findIndex((l) => l.id === qLectureId)
    : 0;

  const currentLecture = allLectures[currentIdx];

  if (!currentLecture) notFound();

  const prevLectureId = currentIdx > 0 ? allLectures[currentIdx - 1].id : null;
  const nextLectureId =
    currentIdx < allLectures.length - 1 ? allLectures[currentIdx + 1].id : null;

  // Get progress for current lecture
  const lectureProgress = enrollment.lectureProgresses.find(
    (p) => p.lectureId === currentLecture.id
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Header bar */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
            <h1 className="text-white font-semibold text-sm line-clamp-1">
              {course.title}
            </h1>
            <div className="text-gray-400 text-xs">
              진도 {Math.round(enrollment.progressPct)}%
            </div>
          </div>

          {/* Video */}
          <div className="flex-1 flex flex-col justify-center bg-black p-4 lg:p-8">
            {currentLecture.hlsUrl ? (
              <VideoPlayer
                src={currentLecture.hlsUrl}
                enrollmentId={enrollment.id}
                lectureId={currentLecture.id}
                initialWatchedSeconds={lectureProgress?.watchedSeconds || 0}
              />
            ) : (
              <div className="aspect-video bg-gray-800 rounded-lg flex flex-col items-center justify-center text-white gap-4">
                <Lock className="h-16 w-16 text-gray-500" />
                <div className="text-center">
                  <p className="text-lg font-medium mb-1">영상이 준비 중입니다</p>
                  <p className="text-gray-400 text-sm">
                    강사가 곧 강의를 업로드할 예정입니다.
                  </p>
                </div>
              </div>
            )}

            {/* Lecture Info */}
            <div className="mt-4 text-white">
              <p className="text-xs text-gray-400 mb-1">
                {currentLecture.sectionTitle}
              </p>
              <h2 className="text-xl font-bold mb-2">{currentLecture.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{formatDuration(currentLecture.duration)}</span>
                {lectureProgress?.isCompleted && (
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    완료
                  </span>
                )}
              </div>
            </div>

            <LectureControls
              courseId={courseId}
              enrollmentId={enrollment.id}
              lectureId={currentLecture.id}
              isCompleted={lectureProgress?.isCompleted || false}
              prevLectureId={prevLectureId}
              nextLectureId={nextLectureId}
            />

            <div className="mt-6">
              <LectureNoteWidget lectureId={currentLecture.id} />
            </div>
          </div>
        </div>

        {/* Sidebar - Curriculum */}
        <div className="w-full lg:w-80 bg-gray-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="text-white font-semibold">강의 목록</h2>
            <div className="h-1 bg-gray-700 rounded-full mt-2">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${enrollment.progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {course.sections.map((section) => (
              <div key={section.id}>
                <div className="px-4 py-2 bg-gray-700/50 border-b border-gray-700">
                  <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
                    {section.title}
                  </h3>
                </div>
                {section.lectures.map((lecture) => {
                  const progress = enrollment.lectureProgresses.find(
                    (p) => p.lectureId === lecture.id
                  );
                  const isCurrent = lecture.id === currentLecture.id;

                  return (
                    <LectureNavigation
                      key={lecture.id}
                      courseId={courseId}
                      lecture={lecture}
                      isCurrent={isCurrent}
                      isCompleted={progress?.isCompleted || false}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
