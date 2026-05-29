# backend/app/sockets/presence_socket.py

from flask import request, session
from flask_socketio import emit, join_room
from app import socketio
from app.services.auth_service import AuthService
from app.sockets.presence_manager import presence_manager

auth_service = AuthService()

@socketio.on('authenticate')
def on_authenticate(data):
    """Event for user to identify themselves with a token."""
    token = data.get('token')
    if not token:
        return
    
    user, error = auth_service.verify_token(token)
    if error:
        return
    
    # Store user info in session for disconnect handler
    session['user_id'] = user.id
    join_room(user.id)
    
    presence_manager.add_connection(user.id, request.sid)
    
    # Send initial online count to the user
    emit('online_count', {'count': presence_manager.get_online_count()})

@socketio.on('disconnect')
def on_disconnect():
    user_id = presence_manager.get_user_for_sid(request.sid)
    if user_id:
        presence_manager.remove_connection(user_id, request.sid)
        socketio.emit('user_offline', {'user_id': user_id})
