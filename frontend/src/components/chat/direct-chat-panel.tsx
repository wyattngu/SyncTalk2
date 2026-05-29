// src/components/chat/direct-chat-panel.tsx

"use client";

import { useState } from "react";
import { type Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/auth-store";
import { useBlockStatus } from "@/hooks/use-block-status";
import { useDirectMessages } from "@/hooks/use-direct-messages";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { ChatUser } from "@/services/chat";
import { ChatHeader } from "./chat-header";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";

interface DirectChatPanelProps {
  otherUserId: string;
  otherUser: ChatUser | null;
  socket: Socket | null;
  connected: boolean;
  isBotChat?: boolean;
}

function DirectChatPanel({
  otherUser,
  otherUserId,
  socket,
  connected,
  isBotChat = false,
}: DirectChatPanelProps) {
  const { user } = useAuthStore();
  const myId = user?.id ?? "";

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const {
    messages,
    isLoading,
    sending,
    aiThinking,
    typingLabel,
    sendMessage,
    deleteMessage,
    emitTyping,
    emitStopTyping,
  } = useDirectMessages({ otherUserId, isBotChat, socket, connected });

  const { isBlocked } = useBlockStatus({
    otherUserId,
    enabled: !isBotChat,
  });

  function handleDeleteClick(id: string) {
    setMessageToDelete(id);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (messageToDelete) {
      await deleteMessage(messageToDelete);
      setMessageToDelete(null);
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete message?"
        description="This message will be removed for you. This action cannot be undone."
      />
      <ChatHeader
        user={otherUser}
        isBotChat={isBotChat}
      />
      <MessageList
        messages={messages}
        isLoading={isLoading}
        isBotChat={isBotChat}
        myId={myId}
        otherName={otherUser?.username ?? "Conversation"}
        typingLabel={typingLabel}
        aiThinking={aiThinking}
        onDeleteMessage={handleDeleteClick}
      />
      <MessageComposer
        isBotChat={isBotChat}
        isBlocked={isBlocked}
        connected={connected}
        sending={sending}
        aiThinking={aiThinking}
        onSend={(content, imageUrl) => sendMessage(content, imageUrl)}
        onTyping={emitTyping}
        onStopTyping={emitStopTyping}
      />
    </div>
  );
}

export default DirectChatPanel;
