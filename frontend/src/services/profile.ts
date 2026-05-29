import browserClient from "@/lib/api-client";
import { apiPaths } from "@/constants";
import type { AuthUser } from "./auth";

export interface BlockedUser {
  id: string;
  username: string;
  blocked_at: string;
}

export const profileService = {
  me: async (): Promise<AuthUser> => {
    const res = await browserClient.get(apiPaths.PROFILE);
    return res.data.data;
  },
  update: async (payload: { username: string }): Promise<AuthUser> => {
    const res = await browserClient.put(apiPaths.PROFILE, payload);
    return res.data.data;
  },
  listBlocked: async (): Promise<BlockedUser[]> => {
    const res = await browserClient.get(apiPaths.USERS_BLOCKED);
    return res.data.data ?? [];
  },
  unblock: async (userId: string) => {
    await browserClient.post(apiPaths.unblockUser(userId), {});
  },
};
