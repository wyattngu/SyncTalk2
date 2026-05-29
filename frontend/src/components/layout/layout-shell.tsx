"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SideNav } from "@/components/layout/side-nav";

interface LayoutShellProps {
  navbar: ReactNode;
  children: ReactNode;
}

/**
 * App-wide chrome.
 *
 * - Auth pages (sign-in, sign-up) get NO side nav and NO top navbar — they own
 *   the full viewport with their hero design.
 * - Everything else gets the fixed left SideNav (256px) + top Navbar inside the
 *   right column.
 */
export function LayoutShell({ navbar, children }: LayoutShellProps) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SideNav />

      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        {navbar}
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
