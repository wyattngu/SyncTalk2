"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { authService } from "@/services/auth";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authService.register(username, email, password);
      const loginRes = await authService.login(email, password);
      setToken(loginRes.token);
      setUser(loginRes.user);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the SyncTalk community in seconds"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
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
        <Field
          label="Username"
          icon="person"
          type="text"
          value={username}
          onChange={setUsername}
          placeholder="janedoe"
          minLength={2}
          required
        />

        <Field
          label="Email"
          icon="mail"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          required
        />

        <Field
          label="Password"
          icon="lock"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 6 characters"
          minLength={6}
          required
        />

        <Field
          label="Confirm password"
          icon="lock"
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
          {!loading && (
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

interface FieldProps {
  label: string;
  icon: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
}

function Field({
  label,
  icon,
  type,
  value,
  onChange,
  placeholder,
  minLength,
  required,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}
