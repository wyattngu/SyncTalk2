"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Soft brand glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[460px] w-[460px] rounded-full bg-primary-fixed-dim opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[460px] w-[460px] rounded-full bg-secondary-container opacity-50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <span className="material-symbols-outlined text-[22px]">domain</span>
          </div>
          <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
            SyncTalk
          </span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
