"use client";

import { useNotificationCounts } from "@/hooks/useNotificationCounts";

type UnreadBadgeProps = {
  count: number;
  className?: string;
};

function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className={
        className ??
        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
      }
    >
      {label}
    </span>
  );
}

export function SupportUnreadBadge({ className }: { className?: string }) {
  const { unreadSupportCount } = useNotificationCounts();
  return <UnreadBadge count={unreadSupportCount} className={className} />;
}

export function ErrorsUnreadBadge({ className }: { className?: string }) {
  const { unreadErrorsCount } = useNotificationCounts();
  return <UnreadBadge count={unreadErrorsCount} className={className} />;
}
