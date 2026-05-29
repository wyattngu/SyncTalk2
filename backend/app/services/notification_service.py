# backend/app/services/notification_service.py

from app.repositories.notification_repository import NotificationRepository

notif_repo = NotificationRepository()

class NotificationService:

    def get_notifications(self, user_id):
        notifications = notif_repo.get_by_user(user_id)
        return notifications, None

    def get_unread_notifications(self, user_id):
        notifications = notif_repo.get_unread(user_id)
        return notifications, None

    def mark_as_read(self, notification_id, user_id):
        notification = notif_repo.find_by_id(notification_id)
        if not notification:
            return None, 'Notification not found'
        if notification.user_id != user_id:
            return None, 'Unauthorized'
        notification = notif_repo.mark_as_read(notification_id)
        return notification, None

    def mark_all_as_read(self, user_id):
        notifications = notif_repo.mark_all_as_read(user_id)
        return notifications, None

    def delete_notification(self, notification_id, user_id):
        notification = notif_repo.find_by_id(notification_id)
        if not notification:
            return None, 'Notification not found'
        if notification.user_id != user_id:
            return None, 'Unauthorized'
        notif_repo.delete(notification_id)
        return True, None