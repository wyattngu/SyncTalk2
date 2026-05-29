# backend/app/sockets/notification_socket.py

from flask_socketio import emit, join_room
from app import socketio
from app.services.auth_service import AuthService
from app.repositories.user_repository import UserRepository

auth_service = AuthService()
user_repo = UserRepository()

@socketio.on('connect')
def on_connect(auth):
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get('token')

    if not token:
        return

    user, error = auth_service.verify_token(token)
    if error:
        return

    join_room(user.id)
    user_repo.update_online_status(user.id, True)
    emit('user_online', {
        'user_id': user.id,
        'username': user.username
    }, broadcast=True)

@socketio.on('disconnect')
def on_disconnect():
    pass

@socketio.on('user_disconnect')
def on_user_disconnect(data):
    token = data.get('token') if isinstance(data, dict) else None
    if not token:
        return

    user, error = auth_service.verify_token(token)
    if error:
        return

    user_repo.update_online_status(user.id, False)
    emit('user_offline', {
        'user_id': user.id,
        'username': user.username
    }, broadcast=True)
