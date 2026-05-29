import browserClient from "@/lib/api-client";

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

export const notificationsService = {
  list: async (): Promise<NotificationItem[]> => {
    const res = await browserClient.get("/api/notifications");
    return res.data.data ?? [];
  },
  markRead: async (id: string) => {
    await browserClient.put(`/api/notifications/${id}/read`);
  },
};
