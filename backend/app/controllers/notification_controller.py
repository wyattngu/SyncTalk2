# backend/app/controllers/notification_controller.py

from flask import Blueprint
from app.services.notification_service import NotificationService
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response

notification_bp = Blueprint('notification', __name__, url_prefix='/api/notifications')
notification_service = NotificationService()

@notification_bp.route('', methods=['GET'])
@token_required
def get_notifications(current_user):
    notifications, error = notification_service.get_notifications(current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(
        data=[{
            'id': n.id,
            'type': n.type,
            'message': n.message,
            'is_read': n.is_read,
            'reference_id': n.reference_id,
            'created_at': (n.created_at.isoformat() + 'Z') if n.created_at else None
        } for n in notifications]
    )

@notification_bp.route('/unread', methods=['GET'])
@token_required
def get_unread(current_user):
    notifications, error = notification_service.get_unread_notifications(current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(
        data=[{
            'id': n.id,
            'type': n.type,
            'message': n.message,
            'is_read': n.is_read,
            'reference_id': n.reference_id,
            'created_at': (n.created_at.isoformat() + 'Z') if n.created_at else None
        } for n in notifications]
    )

@notification_bp.route('/<notification_id>/read', methods=['PUT'])
@token_required
def mark_as_read(current_user, notification_id):
    notification, error = notification_service.mark_as_read(notification_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Notification marked as read')

@notification_bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_as_read(current_user):
    notifications, error = notification_service.mark_all_as_read(current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='All notifications marked as read')

@notification_bp.route('/<notification_id>', methods=['DELETE'])
@token_required
def delete_notification(current_user, notification_id):
    result, error = notification_service.delete_notification(notification_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Notification deleted successfully')