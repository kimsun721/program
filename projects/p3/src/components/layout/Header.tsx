"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Heart, LogOut, User, Menu, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getUnreadCount } from "@/actions/notifications";

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    if (!session?.user) return;
    getUnreadCount().then(setUnreadCount).catch(() => {});
    const interval = setInterval(() => {
      getUnreadCount().then(setUnreadCount).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [session?.user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">LinguaClass</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/courses"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            강의 목록
          </Link>
          {session?.user && (
            <>
              <Link
                href="/my"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                내 강의
              </Link>
              <Link
                href="/my/practice"
                className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
              >
                <Zap className="h-3.5 w-3.5" />
                학습
              </Link>
              <Link
                href="/wishlist"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <Heart className="h-4 w-4" />
                찜 목록
              </Link>
              {session.user.role?.includes("INSTRUCTOR") && (
                <Link
                  href="/instructor/dashboard"
                  className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
                >
                  강사
                </Link>
              )}
              {session.user.role?.includes("ADMIN") && (
                <Link
                  href="/admin/dashboard"
                  className="text-sm font-medium text-red-700 hover:text-red-900 transition-colors"
                >
                  관리자
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-2">
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200" />
          ) : session?.user ? (
            <div className="flex items-center gap-2">
              <NotificationBell unreadCount={unreadCount} />
              <Link href="/my" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {session.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  {session.user.name}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">회원가입</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="메뉴 열기"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          <Link
            href="/courses"
            className="block text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            강의 목록
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/my"
                className="block text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                내 강의
              </Link>
              <Link
                href="/my/practice"
                className="block text-sm font-medium text-purple-600 hover:text-purple-800 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                ⚡ 학습 연습
              </Link>
              <Link
                href="/wishlist"
                className="block text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                찜 목록
              </Link>
              <Link
                href="/my/notifications"
                className="block text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                🔔 알림 {unreadCount > 0 && `(${unreadCount})`}
              </Link>
              <div className="flex items-center gap-2 py-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{session.user.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full"
              >
                로그아웃
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>회원가입</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
