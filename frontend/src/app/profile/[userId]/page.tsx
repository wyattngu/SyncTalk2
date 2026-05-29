"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Heart,
  MessageCircle,
  MessageSquare,
  ShieldOff,
  ShieldX,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat";
import { usersService, type PublicProfile } from "@/services/users";

function formatJoined(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  } catch {
    return "—";
  }
}

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;
  const router = useRouter();
  const { isAuthenticated, user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockBusy, setBlockBusy] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    // Looking at your own profile? Use the editable /profile page instead.
    if (userId && currentUser?.id === userId) {
      router.replace("/profile");
      return;
    }

    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    usersService
      .getPublicProfile(userId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Could not load this profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId, currentUser?.id, router]);

  async function refreshProfile() {
    if (!userId) return;
    try {
      const p = await usersService.getPublicProfile(userId);
      setProfile(p);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleBlock() {
    if (!profile || blockBusy) return;
    if (profile.block.is_blocked_by_me) {
      setBlockBusy(true);
      try {
        await chatService.unblockUser(profile.id);
        toast.success("User unblocked");
        await refreshProfile();
      } catch (err) {
        console.error(err);
        toast.error("Action failed");
      } finally {
        setBlockBusy(false);
      }
    } else {
      setShowBlockConfirm(true);
    }
  }

  async function confirmBlock() {
    if (!profile) return;
    setShowBlockConfirm(false);
    setBlockBusy(true);
    try {
      await chatService.blockUser(profile.id);
      toast.success("User blocked");
      await refreshProfile();
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    } finally {
      setBlockBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full px-6 py-10">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <p className="text-sm text-muted-foreground">
              {error ?? "Profile not found."}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const blockedByMe = profile.block.is_blocked_by_me;
  const blockedByThem = profile.block.is_blocked_by_them;
  const canMessage = !blockedByMe && !blockedByThem;

  return (
    <div className="mx-auto w-full px-6 py-8">
      {/* Identity card */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <Avatar className="size-20">
                  {profile.profile_image_url && (
                    <AvatarImage
                      src={profile.profile_image_url}
                      alt={profile.username}
                    />
                  )}
                  <AvatarFallback
                    className={cn(
                      "text-2xl font-bold",
                      profile.is_online
                        ? "gradient-brand text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {profile.username[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span
                  aria-label={profile.is_online ? "online" : "offline"}
                  className={cn(
                    "absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-card",
                    profile.is_online ? "bg-success" : "bg-muted-foreground/40",
                  )}
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {profile.username}
                  </h1>
                  {profile.is_online ? (
                    <Badge className="bg-success-soft text-[10px] uppercase tracking-wider text-success hover:bg-success-soft">
                      Online
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase tracking-wider"
                    >
                      Offline
                    </Badge>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  Joined {formatJoined(profile.created_at)}
                </p>

                <div className="mt-4 flex gap-6">
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {profile.friend_count}
                    </p>
                    <p className="text-xs text-muted-foreground">Friends</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {profile.thread_count}
                    </p>
                    <p className="text-xs text-muted-foreground">Threads</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-2">
              <FriendActionButton
                otherUserId={profile.id}
                initialRelation={profile.friendship}
              />
              {canMessage && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/chat?userId=${profile.id}`}>
                    <MessageCircle className="size-4" />
                    Message
                  </Link>
                </Button>
              )}
              <Button
                onClick={toggleBlock}
                disabled={blockBusy}
                variant="outline"
                size="sm"
                className={cn(
                  blockedByMe
                    ? "text-warning hover:text-warning"
                    : "text-destructive hover:text-destructive",
                )}
              >
                {blockedByMe ? (
                  <ShieldOff className="size-4" />
                ) : (
                  <ShieldX className="size-4" />
                )}
                {blockedByMe ? "Unblock" : "Block"}
              </Button>
            </div>
          </div>

          {blockedByThem && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
              This user has blocked you. You can&apos;t message them.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity — threads sorted newest first */}
      <Card className="mt-5">
        <CardContent>
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-foreground">
            <Users className="size-4 text-primary" />
            Activity
            {profile.thread_count > 0 && (
              <span className="ml-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                {profile.thread_count}
              </span>
            )}
          </h2>

          {profile.threads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {profile.username} hasn&apos;t posted any threads yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {profile.threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/threads/${t.id}`}
                  className="group rounded-xl border border-border bg-surface-container-low/40 p-4 transition-colors hover:border-primary/40 hover:bg-surface-container"
                >
                  <p className="mb-1 font-semibold text-foreground group-hover:text-primary line-clamp-1">
                    {t.title}
                  </p>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                    {t.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3.5" />
                      {t.reply_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-3.5" />
                      {t.like_count}
                    </span>
                    <span className="ml-auto">
                      {new Date(t.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block confirmation dialog */}
      {showBlockConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-dialog-title"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBlockConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="size-7 text-destructive" />
              </div>
            </div>
            <div className="mb-6 text-center">
              <h2 id="block-dialog-title" className="mb-1 text-lg font-bold text-foreground">
                Block {profile.username}?
              </h2>
              <p className="text-sm text-muted-foreground">
                They won&apos;t be able to message you or see your profile. You can unblock them at any time.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowBlockConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmBlock}>
                <ShieldAlert className="mr-2 size-4" />
                Block
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
