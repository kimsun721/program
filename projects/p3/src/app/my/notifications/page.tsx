import { requireUser } from "@/lib/rbac";
import { getMyNotifications, markAllAsRead } from "@/actions/notifications";
import { formatDistanceToNow } from "@/lib/utils";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "알림" };

const typeIcon: Record<string, string> = {
  QNA_ANSWERED: "💬",
  COURSE_APPROVED: "✅",
  COURSE_REJECTED: "❌",
  INSTRUCTOR_APPROVED: "🎓",
  INSTRUCTOR_REJECTED: "❌",
  PAYMENT_DONE: "💳",
  COURSE_COMPLETE: "🏆",
};

const typeBg: Record<string, string> = {
  QNA_ANSWERED: "bg-blue-50 border-blue-100",
  COURSE_APPROVED: "bg-green-50 border-green-100",
  COURSE_REJECTED: "bg-red-50 border-red-100",
  INSTRUCTOR_APPROVED: "bg-purple-50 border-purple-100",
  INSTRUCTOR_REJECTED: "bg-red-50 border-red-100",
  PAYMENT_DONE: "bg-teal-50 border-teal-100",
  COURSE_COMPLETE: "bg-yellow-50 border-yellow-100",
};

async function MarkAllReadButton() {
  "use server";
  await markAllAsRead();
}

export default async function NotificationsPage() {
  await requireUser();
  const notifications = await getMyNotifications(50);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">알림</h1>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <form action={MarkAllReadButton}>
            <Button variant="outline" size="sm" type="submit">
              모두 읽음
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <BellOff className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">아직 알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const card = (
              <div
                className={`flex gap-4 p-4 rounded-xl border transition-all ${
                  !n.isRead
                    ? (typeBg[n.type] ?? "bg-blue-50 border-blue-100")
                    : "bg-white border-gray-100"
                }`}
              >
                <span className="text-2xl flex-shrink-0">{typeIcon[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{n.body}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {formatDistanceToNow(n.createdAt)}
                  </p>
                </div>
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link} className="block hover:opacity-90">
                {card}
              </Link>
            ) : (
              <div key={n.id}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
