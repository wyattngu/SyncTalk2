import { create } from "zustand";

interface PresenceState {
  onlineCount: number;
  userStatuses: Record<string, { is_online: boolean; last_seen: string }>;
  
  setOnlineCount: (count: number) => void;
  updateUserStatus: (userId: string, is_online: boolean, last_seen: string) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineCount: 0,
  userStatuses: {},

  setOnlineCount: (count) => set({ onlineCount: count }),
  
  updateUserStatus: (userId, is_online, last_seen) => 
    set((state) => ({
      userStatuses: {
        ...state.userStatuses,
        [userId]: { is_online, last_seen }
      }
    })),
}));
