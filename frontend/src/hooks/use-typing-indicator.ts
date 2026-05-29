"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/auth-store";
import { ClientEvents, ServerEvents, type TypingPayload } from "@/constants";

interface UseTypingIndicatorParams {
  otherUserId: string;
  socket: Socket | null;
  enabled: boolean;
}

interface UseTypingIndicatorResult {
  typingLabel: string | null;
  emitTyping: () => void;
  emitStopTyping: () => void;
}

const STOP_TYPING_DELAY_MS = 2000;

export function useTypingIndicator({
  otherUserId,
  socket,
  enabled,
}: UseTypingIndicatorParams): UseTypingIndicatorResult {
  const { token } = useAuthStore();
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !socket) return;

    function handleTyping(payload: TypingPayload) {
      if (payload.user_id !== otherUserId) return;
      setTypingLabel("Typing...");
    }

    function handleStopTyping(payload: TypingPayload) {
      if (payload.user_id !== otherUserId) return;
      setTypingLabel(null);
    }

    socket.on(ServerEvents.USER_TYPING, handleTyping);
    socket.on(ServerEvents.USER_STOP_TYPING, handleStopTyping);

    return () => {
      socket.off(ServerEvents.USER_TYPING, handleTyping);
      socket.off(ServerEvents.USER_STOP_TYPING, handleStopTyping);
    };
  }, [enabled, socket, otherUserId]);

  const emitStopTyping = useCallback(() => {
    if (!enabled || !socket || !token) return;
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    socket.emit(ClientEvents.STOP_TYPING, { token, receiver_id: otherUserId });
  }, [enabled, socket, token, otherUserId]);

  const emitTyping = useCallback(() => {
    if (!enabled || !socket || !token) return;
    socket.emit(ClientEvents.TYPING, { token, receiver_id: otherUserId });

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      socket.emit(ClientEvents.STOP_TYPING, {
        token,
        receiver_id: otherUserId,
      });
      stopTimerRef.current = null;
    }, STOP_TYPING_DELAY_MS);
  }, [enabled, socket, token, otherUserId]);

  useEffect(
    () => () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      setTypingLabel(null);
    },
    [otherUserId],
  );

  return { typingLabel, emitTyping, emitStopTyping };
}
