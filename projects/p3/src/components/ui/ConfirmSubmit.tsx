"use client";

/**
 * 폼 내부 제출 버튼 — 클릭 시 확인 다이얼로그를 띄우고,
 * 취소하면 제출을 막는다. 파괴적 액션(삭제 등)에 사용.
 */
export function ConfirmSubmit({
  message,
  className,
  title,
  children,
}: {
  message: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      title={title}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
