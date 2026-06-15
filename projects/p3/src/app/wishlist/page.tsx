import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getWishlist } from "@/actions/wishlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Star } from "lucide-react";
import { formatPrice, getLevelLabel } from "@/lib/utils";
import RemoveWishlistButton from "./RemoveWishlistButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "찜 목록",
};

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/wishlist");
  }

  const wishlist = await getWishlist();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">찜 목록</h1>
        <p className="text-gray-500">관심 있는 강의를 모아봤어요.</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            찜한 강의가 없습니다
          </h3>
          <p className="text-gray-500 mb-6">
            관심 있는 강의를 찜하고 나중에 수강해보세요.
          </p>
          <Button asChild>
            <Link href="/courses">강의 둘러보기</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                {item.course.thumbnail ? (
                  <Image
                    src={item.course.thumbnail}
                    alt={item.course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-blue-200">
                    <BookOpen className="h-12 w-12 text-blue-400" />
                  </div>
                )}
                <Badge className="absolute top-2 left-2 bg-blue-600">
                  {item.course.language.nameKo}
                </Badge>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.course.category.name}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getLevelLabel(item.course.level)}
                  </Badge>
                </div>

                <Link href={`/courses/${item.course.id}`}>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 hover:text-blue-600 transition-colors">
                    {item.course.title}
                  </h3>
                </Link>

                <p className="text-sm text-gray-500 mb-3">
                  {item.course.instructor.realName} 강사
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {item.course.avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({item.course.reviewCount})
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatPrice(item.course.price)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" size="sm" asChild>
                    <Link href={`/courses/${item.course.id}`}>수강 신청</Link>
                  </Button>
                  <RemoveWishlistButton courseId={item.course.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
