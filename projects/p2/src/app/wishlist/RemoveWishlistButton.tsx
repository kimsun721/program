"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { removeFromWishlist } from "@/actions/wishlist";
import { Heart } from "lucide-react";

export default function RemoveWishlistButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    await removeFromWishlist(courseId);
    router.refresh();
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
      className="flex-shrink-0"
    >
      <Heart className="h-4 w-4 fill-red-400 text-red-400" />
    </Button>
  );
}
