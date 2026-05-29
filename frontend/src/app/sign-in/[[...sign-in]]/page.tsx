"use client";

import Link from "next/link";
import { useLoginForm } from "@/hooks/use-auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInPage() {
  const { email, setEmail, password, setPassword, error, loading, submit } =
    useLoginForm();

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to SyncTalk"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive-soft p-3 text-sm text-destructive">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]">
            error
          </span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground">
              mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground">
              lock
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
          {!loading && (
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          )}
        </button>
      </form>

      <div className="mt-5 rounded-lg bg-surface-container-low px-3 py-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Demo:</span>{" "}
        <code className="rounded bg-card px-1 py-0.5 text-foreground">
          alice@synctalk.dev
        </code>{" "}
        /{" "}
        <code className="rounded bg-card px-1 py-0.5 text-foreground">
          Password123!
        </code>
      </div>
    </AuthShell>
  );
}
