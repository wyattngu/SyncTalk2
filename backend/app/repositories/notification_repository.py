# backend/app/repositories/notification_repository.py

from app import db
from app.models.notification import Notification

class NotificationRepository:

    def create(self, user_id, type, message, reference_id=None):
        notification = Notification(
            user_id=user_id,
            type=type,
            message=message,
            reference_id=reference_id
        )
        db.session.add(notification)
        db.session.commit()

        # Emit real-time notification
        try:
            from app import socketio
            socketio.emit('notification:new', {
                'id': notification.id,
                'type': notification.type,
                'message': notification.message,
                'reference_id': notification.reference_id,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat() + 'Z'
            }, room=user_id)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"[notification] socket emit failed: {e}")

        return notification

    def find_by_id(self, notification_id):
        return Notification.query.filter_by(id=notification_id).first()

    def get_by_user(self, user_id):
        return Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()

    def get_unread(self, user_id):
        return Notification.query.filter_by(user_id=user_id, is_read=False).all()

    def mark_as_read(self, notification_id):
        notification = self.find_by_id(notification_id)
        if notification:
            notification.is_read = True
            db.session.commit()
        return notification

    def mark_all_as_read(self, user_id):
        notifications = Notification.query.filter_by(user_id=user_id, is_read=False).all()
        for notification in notifications:
            notification.is_read = True
        db.session.commit()
        return notifications

    def delete(self, notification_id):
        notification = self.find_by_id(notification_id)
        if notification:
            db.session.delete(notification)
            db.session.commit()
        return notification