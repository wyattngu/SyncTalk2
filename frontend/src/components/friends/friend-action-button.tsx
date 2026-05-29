"use client";

import { Check, Loader2, UserCheck, UserPlus, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FriendRelation } from "@/constants";
import { useFriendship } from "@/hooks/use-friendship";
import type { RelationStatus } from "@/services/friends";

interface FriendActionButtonProps {
  otherUserId: string;
  /** Initial relation from the public-profile endpoint — saves a roundtrip. */
  initialRelation?: RelationStatus;
  /** Hide entirely if the relation is `self` (defaults to true). */
  hideOnSelf?: boolean;
}

/**
 * Smart action button that renders the right control(s) based on the
 * directional friend relation between the current user and `otherUserId`:
 *
 *   none         → Add Friend
 *   pending_out  → Cancel Request
 *   pending_in   → Accept | Decline
 *   friends      → Friends ✓ (click to unfriend, with confirm)
 *   self         → null (or Edit Profile, depending on `hideOnSelf`)
 */
export function FriendActionButton({
  otherUserId,
  initialRelation,
  hideOnSelf = true,
}: FriendActionButtonProps) {
  const {
    relation,
    loading,
    acting,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
    unfriend,
  } = useFriendship({ otherUserId, initial: initialRelation });

  if (loading) {
    return (
      <Button disabled variant="outline" size="sm">
        <Loader2 className="size-4 animate-spin" />
      </Button>
    );
  }

  if (relation === "self") {
    return hideOnSelf ? null : null;
  }

  if (relation === FriendRelation.NONE) {
    return (
      <Button onClick={sendRequest} disabled={acting} size="sm">
        {acting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        Add friend
      </Button>
    );
  }

  if (relation === FriendRelation.PENDING_OUT) {
    return (
      <Button
        onClick={cancelRequest}
        disabled={acting}
        variant="outline"
        size="sm"
      >
        {acting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <X className="size-4" />
        )}
        Cancel request
      </Button>
    );
  }

  if (relation === FriendRelation.PENDING_IN) {
    return (
      <div className="flex gap-2">
        <Button onClick={acceptRequest} disabled={acting} size="sm">
          {acting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Accept
        </Button>
        <Button
          onClick={declineRequest}
          disabled={acting}
          variant="outline"
          size="sm"
        >
          <X className="size-4" />
          Decline
        </Button>
      </div>
    );
  }

  // FriendRelation.FRIENDS
  return (
    <Button
      onClick={() => {
        if (confirm("Remove this user from your friends?")) {
          void unfriend();
        }
      }}
      disabled={acting}
      variant="outline"
      size="sm"
      className="group"
    >
      {acting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          <UserCheck className="size-4 group-hover:hidden" />
          <UserX className="hidden size-4 group-hover:inline-flex" />
        </>
      )}
      <span className="group-hover:hidden">Friends</span>
      <span className="hidden group-hover:inline">Unfriend</span>
    </Button>
  );
}
