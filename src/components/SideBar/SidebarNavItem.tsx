"use client";

import {
  SIDEBAR_DENIED_TOOLTIP,
  type SidebarNavKey,
  canAccessSidebarNav,
  type SidebarUser,
} from "@/lib/sidebarPermissions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DISABLED_NAV_CLASS =
  "pointer-events-auto cursor-not-allowed text-slate-400 opacity-50 hover:bg-transparent hover:text-slate-400 data-[active=true]:bg-transparent data-[active=true]:text-slate-400 data-[active=true]:hover:bg-transparent data-[active=true]:hover:text-slate-400";

type Props = {
  navKey: SidebarNavKey;
  user: SidebarUser | null;
  title: string;
  href?: string;
  isActive: boolean;
  icon: ComponentType<{ className?: string }>;
  menuButtonClassName?: string;
  linkClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
  itemClassName?: string;
  label?: ReactNode;
  asButton?: boolean;
  onClick?: () => void;
  children?: ReactNode;
};

export function SidebarNavItem({
  navKey,
  user,
  title,
  href,
  isActive,
  icon: Icon,
  menuButtonClassName,
  linkClassName,
  labelClassName,
  iconClassName = "h-5 w-5 shrink-0",
  itemClassName,
  label,
  asButton = false,
  onClick,
  children,
}: Props) {
  const allowed = canAccessSidebarNav(user, navKey);
  const displayLabel = label ?? title;

  const inner = (
    <>
      <Icon className={iconClassName} />
      {typeof displayLabel === "string" ? (
        <span className={labelClassName}>{displayLabel}</span>
      ) : (
        displayLabel
      )}
    </>
  );

  const button = (
    <SidebarMenuButton
      type={asButton ? "button" : undefined}
      asChild={allowed && !asButton && Boolean(href)}
      isActive={allowed && isActive}
      tooltip={allowed ? title : undefined}
      onClick={
        allowed
          ? onClick
          : (event) => {
              event.preventDefault();
              event.stopPropagation();
            }
      }
      className={cn(menuButtonClassName, !allowed && DISABLED_NAV_CLASS)}
    >
      {allowed && href && !asButton ? (
        <Link href={href} className={linkClassName}>
          {inner}
        </Link>
      ) : (
        <span
          className={cn(
            "flex w-full items-center",
            linkClassName,
            !allowed && "select-none"
          )}
          aria-disabled={!allowed}
        >
          {inner}
        </span>
      )}
    </SidebarMenuButton>
  );

  const item = (
    <SidebarMenuItem className={itemClassName}>
      {!allowed ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" align="center">
            {SIDEBAR_DENIED_TOOLTIP}
          </TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
      {allowed ? children : null}
    </SidebarMenuItem>
  );

  return item;
}
