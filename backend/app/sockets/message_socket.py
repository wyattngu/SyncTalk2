# backend/app/sockets/message_socket.py

from flask_socketio import emit, join_room, leave_room
from app import socketio
from app.services.message_service import MessageService
from app.services.auth_service import AuthService

message_service = MessageService()
auth_service = AuthService()

@socketio.on('join')
def on_join(data):
    token = data.get('token')
    if not token:
        emit('error', {'message': 'Token is missing'})
        return

    user, error = auth_service.verify_token(token)
    if error:
        emit('error', {'message': error})
        return

    join_room(user.id)
    emit('joined', {'message': f'User {user.username} joined room {user.id}'})

@socketio.on('leave')
def on_leave(data):
    token = data.get('token')
    if not token:
        emit('error', {'message': 'Token is missing'})
        return

    user, error = auth_service.verify_token(token)
    if error:
        emit('error', {'message': error})
        return

    leave_room(user.id)
    emit('left', {'message': f'User {user.username} left room {user.id}'})

@socketio.on('send_message')
def on_send_message(data):
    token = data.get('token')
    if not token:
        emit('error', {'message': 'Token is missing'})
        return

    user, error = auth_service.verify_token(token)
    if error:
        emit('error', {'message': error})
        return

    receiver_id = data.get('receiver_id')
    content = data.get('content')
    image_url = data.get('image_url')
    # Echoed back so the sender's optimistic row can be reconciled with the
    # real database row (matched by client_nonce, not by id since the
    # optimistic id is client-generated).
    client_nonce = data.get('client_nonce')


    try:
        message, error = message_service.send_message(
            user.id, receiver_id, content, image_url
        )
        if error:
            emit('error', {'message': error})
            return

        message_data = {
            'id': message.id,
            'sender_id': message.sender_id,
            'receiver_id': message.receiver_id,
            'content': message.content,
            'image_url': message.image_url,
            'is_read': message.is_read,
            'created_at': message.created_at.isoformat() + 'Z' if message.created_at else None,
            'client_nonce': client_nonce,
        }

        # Emit to BOTH rooms so:
        #   - the receiver sees the new message
        #   - the sender's optimistic row (keyed by client_nonce) gets replaced
        #     with the real persisted row (real id, pending=false)
        emit('new_message', message_data, room=receiver_id)
        emit('new_message', message_data, room=user.id)
    except Exception:
        emit('error', {'message': 'Server error while sending message'})

@socketio.on('typing')
def on_typing(data):
    token = data.get('token')
    if not token:
        return

    user, error = auth_service.verify_token(token)
    if error:
        return

    receiver_id = data.get('receiver_id')
    emit('user_typing', {
        'user_id': user.id,
        'username': user.username
    }, room=receiver_id)

@socketio.on('stop_typing')
def on_stop_typing(data):
    token = data.get('token')
    if not token:
        return

    user, error = auth_service.verify_token(token)
    if error:
        return

    receiver_id = data.get('receiver_id')
    emit('user_stop_typing', {
        'user_id': user.id,
        'username': user.username
    }, room=receiver_id)