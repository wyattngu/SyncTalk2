"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";

export default function ProfilePage() {
  const { user, loading, blockedUsers, updateUsername, unblock, signOut } = useProfile();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? "");
  }, [user?.username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUsername(username);
      toast.success("Profile updated", { description: "Your changes have been saved." });
    } catch (err) {
      console.error(err);
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  async function onUnblock(id: string) {
    try {
      await unblock(id);
      toast.success("User unblocked");
    } catch (err) {
      console.error(err);
      toast.error("Could not unblock user");
    }
  }

  return (
    <div className="mx-auto w-full  px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          My profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>

      {/* Identity card */}
      <div className="mb-5 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full gradient-brand text-2xl font-bold text-primary-foreground shadow-md">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold text-foreground">
              {user?.username || "User"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form
        onSubmit={onSubmit}
        className="mb-5 space-y-5 rounded-xl border border-border bg-card p-6"
      >
        <h2 className="font-display text-lg font-bold text-foreground">Edit profile</h2>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Username
          </label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading || saving}
            placeholder="Your display name"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </label>
          <Input value={user?.email ?? ""} disabled className="opacity-60" />
          <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>

        <div className="flex justify-between border-t border-border pt-5">
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive-soft"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign out
          </button>
          <button
            type="submit"
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      {/* Blocked users */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <span className="material-symbols-outlined text-[20px] text-destructive">block</span>
          Blocked users
        </h2>
        {blockedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>
        ) : (
          <ul className="space-y-2">
            {blockedUsers.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-container-low px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {u.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{u.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Blocked {new Date(u.blocked_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onUnblock(u.id)}
                  className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive-soft"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
