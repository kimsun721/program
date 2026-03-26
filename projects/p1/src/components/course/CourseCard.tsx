import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getLevelLabel } from "@/lib/utils";

interface CourseCardProps {
  course: {
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
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group-hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-blue-200">
              <span className="text-4xl">📚</span>
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge variant="default" className="text-xs">
              {course.language.nameKo}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {course.category.name}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getLevelLabel(course.level)}
            </Badge>
          </div>

          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>

          <p className="text-sm text-gray-500 mb-3">
            {course.instructor.realName} 강사
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700">
              {course.avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({course.reviewCount.toLocaleString()})
            </span>
            <span className="text-xs text-gray-400 ml-1">
              · 수강생 {course.enrollmentCount.toLocaleString()}명
            </span>
          </div>

          {/* Price */}
          <div className="font-bold text-lg text-gray-900">
            {formatPrice(course.price)}
          </div>
        </div>
      </div>
    </Link>
  );
}
