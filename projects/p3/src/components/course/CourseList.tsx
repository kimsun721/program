import CourseCard from "./CourseCard";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  thumbnail: string | null;
  price: number;
  avgRating: number;
  reviewCount: number;
  enrollmentCount: number;
  level: string;
  language: {
    nameKo: string;
    code: string;
  };
  category: {
    name: string;
  };
  instructor: {
    realName: string;
    user: {
      nickname: string;
    };
  };
}

interface CourseListProps {
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CourseList({
  courses,
  total,
  page,
  totalPages,
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          강의를 찾을 수 없습니다
        </h3>
        <p className="text-gray-500">검색 조건을 변경하거나 필터를 초기화해보세요.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        총 <span className="font-semibold text-gray-900">{total}</span>개의 강의
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}`}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
