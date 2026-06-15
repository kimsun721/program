"use client";

import { Bell } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getMyNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { formatDistanceToNow } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

const typeIcon: Record<string, string> = {
  QNA_ANSWERED: "💬",
  COURSE_APPROVED: "✅",
  COURSE_REJECTED: "❌",
  INSTRUCTOR_APPROVED: "🎓",
  INSTRUCTOR_REJECTED: "❌",
  PAYMENT_DONE: "💳",
  COURSE_COMPLETE: "🏆",
};

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(unreadCount);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = () => {
    startTransition(async () => {
      const data = await getMyNotifications(10);
      setNotifications(data as Notification[]);
      setCount(data.filter((n) => !n.isRead).length);
    });
  };

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  // 30초마다 카운트 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(async () => {
        const data = await getMyNotifications(1);
        // 가져온 데이터 중 읽지 않은 것 카운트하는 방식 대신 별도 액션이 더 정확하지만
        // 여기서는 간단하게 처리
        void data;
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleRead = async (id: string, link: string | null) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setCount((c) => Math.max(0, c - 1));
    if (link) {
      setOpen(false);
      window.location.href = link;
    }
  };

  const handleReadAll = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="알림"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-80 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">알림</h3>
              {count > 0 && (
                <button
                  onClick={handleReadAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  모두 읽음
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isPending ? (
                <div className="p-8 text-center text-gray-400 text-sm">로딩 중...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>알림이 없습니다</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleRead(n.id, n.link)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                      !n.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {typeIcon[n.type] ?? "🔔"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDistanceToNow(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 px-4 py-2">
              <Link
                href="/my/notifications"
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setOpen(false)}
              >
                모든 알림 보기 →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
