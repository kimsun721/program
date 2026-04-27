"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addToWishlist, removeFromWishlist } from "@/actions/wishlist";
import { Heart } from "lucide-react";

interface WishlistButtonProps {
  courseId: string;
  initialWishlisted: boolean;
  isLoggedIn: boolean;
}

export default function WishlistButton({
  courseId,
  initialWishlisted,
  isLoggedIn,
}: WishlistButtonProps) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/courses/${courseId}`);
      return;
    }

    setLoading(true);

    if (wishlisted) {
      const result = await removeFromWishlist(courseId);
      if (!result.error) setWishlisted(false);
    } else {
      const result = await addToWishlist(courseId);
      if (!result.error) setWishlisted(true);
    }

    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart
        className={`h-4 w-4 mr-2 ${wishlisted ? "fill-red-500 text-red-500" : "text-gray-500"}`}
      />
      {wishlisted ? "찜 취소" : "찜하기"}
    </Button>
  );
}
