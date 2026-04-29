import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-6 py-16">
      <div className="text-7xl font-black tracking-tight text-slate-800">403</div>
      <div className="text-center">
        <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
        <p className="mt-2 text-slate-600">
          이 페이지를 보려면 필요한 권한이 부여되어 있어야 합니다.
        </p>
      </div>
      <Link href="/">
        <Button>홈으로 이동</Button>
      </Link>
    </div>
  );
}
