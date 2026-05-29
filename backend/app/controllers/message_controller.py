# backend/app/controllers/message_controller.py

from flask import Blueprint, request
from app import socketio
from app.services.message_service import MessageService
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response

message_bp = Blueprint('message', __name__, url_prefix='/api/messages')
message_service = MessageService()

@message_bp.route('/conversations', methods=['GET'])
@token_required
def list_conversations(current_user):
    data, error = message_service.list_conversations(current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(data=data)


@message_bp.route('/<receiver_id>', methods=['GET'])
@token_required
def get_conversation(current_user, receiver_id):
    messages, error = message_service.get_conversation(current_user.id, receiver_id)
    if error:
        return error_response(error, 404)
    return success_response(
        data=[{
            'id': m.id,
            'sender_id': m.sender_id,
            'receiver_id': m.receiver_id,
            'content': m.content,
            'image_url': m.image_url,
            'is_read': m.is_read,
            'is_ai': bool(m.is_ai),
            'created_at': (m.created_at.isoformat() + 'Z') if m.created_at else None,
            'edited_at': (m.edited_at.isoformat() + 'Z') if m.edited_at else None
        } for m in messages]
    )

@message_bp.route('/<message_id>', methods=['PUT'])
@token_required
def edit_message(current_user, message_id):
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    content = data.get('content')
    message, error = message_service.edit_message(message_id, current_user.id, content)
    if error:
        return error_response(error, 400)

    return success_response(
        data={
            'id': message.id,
            'content': message.content,
            'edited_at': (message.edited_at.isoformat() + 'Z') if message.edited_at else None
        },
        message='Message updated successfully'
    )

@message_bp.route('/<message_id>', methods=['DELETE'])
@token_required
def delete_message(current_user, message_id):
    result, error = message_service.delete_message(message_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Message deleted successfully')

@message_bp.route('/unread', methods=['GET'])
@token_required
def get_unread(current_user):
    messages, error = message_service.get_unread_messages(current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(
        data=[{
            'id': m.id,
            'sender_id': m.sender_id,
            'content': m.content,
            'created_at': (m.created_at.isoformat() + 'Z') if m.created_at else None
        } for m in messages]
    )

@message_bp.route('/ai-reply', methods=['POST'])
@token_required
def save_ai_reply(current_user):
    """Save an inline @sync AI reply into the DM conversation so it survives reloads."""
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    content = data.get('content', '').strip()
    context_user_id = data.get('context_user_id', '').strip()

    if not content:
        return error_response('Content is required', 400)
    if not context_user_id:
        return error_response('context_user_id is required', 400)

    # Store with sender_id = context_user_id so it naturally appears in the
    # conversation between current_user and context_user, while is_ai=True
    # tells the frontend to render it as an AI bubble.
    from app.repositories.message_repository import MessageRepository
    repo = MessageRepository()
    msg = repo.create(
        sender_id=context_user_id,
        receiver_id=current_user.id,
        content=content,
        is_ai=True,
    )
    return success_response(data={
        'id': msg.id,
        'sender_id': msg.sender_id,
        'receiver_id': msg.receiver_id,
        'content': msg.content,
        'image_url': msg.image_url,
        'is_read': msg.is_read,
        'is_ai': msg.is_ai,
        'created_at': (msg.created_at.isoformat() + 'Z') if msg.created_at else None,
    })


@message_bp.route('/read/<sender_id>', methods=['PUT'])
@token_required
def mark_as_read(current_user, sender_id):
    messages, error = message_service.mark_as_read(sender_id, current_user.id)
    if error:
        return error_response(error, 400)
    # Notify the original sender so their open chat panel can flip the
    # is_read flag on outgoing bubbles → "Seen" indicator updates live.
    if messages:
        socketio.emit(
            'messages_read',
            {'reader_id': current_user.id, 'sender_id': sender_id},
            room=sender_id,
        )
    return success_response(message='Messages marked as read')


