# backend/app/sockets/presence_manager.py

from datetime import datetime, timezone
from app import db, socketio
from app.models.user import User

class PresenceManager:
    def __init__(self):
        # Maps userId -> set of socketIds
        self.user_connections = {}
        # Maps socketId -> userId for reliable disconnect lookup
        self.sid_to_user = {}

    def add_connection(self, user_id, socket_id):
        self.sid_to_user[socket_id] = user_id

        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
            # First connection: mark as online in DB
            self._update_user_status(user_id, True)

        self.user_connections[user_id].add(socket_id)
        self.broadcast_status(user_id, True)
        self.broadcast_online_count()

    def remove_connection(self, user_id, socket_id):
        self.sid_to_user.pop(socket_id, None)

        if user_id in self.user_connections:
            self.user_connections[user_id].discard(socket_id)

            if not self.user_connections[user_id]:
                # Last connection closed: mark as offline in DB
                del self.user_connections[user_id]
                self._update_user_status(user_id, False)
                self.broadcast_status(user_id, False)
                self.broadcast_online_count()

    def get_user_for_sid(self, socket_id):
        return self.sid_to_user.get(socket_id)

    def get_online_count(self):
        return len(self.user_connections)

    def is_user_online(self, user_id):
        return user_id in self.user_connections

    def broadcast_online_count(self):
        socketio.emit('online_count', {'count': self.get_online_count()})

    def broadcast_status(self, user_id, is_online):
        socketio.emit('user_status_change', {
            'user_id': user_id,
            'is_online': is_online,
            'last_seen': datetime.now(timezone.utc).isoformat()
        })

    def _update_user_status(self, user_id, is_online):
        # We need an app context to update the DB from socket handlers
        from flask import current_app
        try:
            with current_app.app_context():
                user = User.query.get(user_id)
                if user:
                    user.is_online = is_online
                    user.last_seen = datetime.now(timezone.utc)
                    db.session.commit()
        except Exception as e:
            # Fallback for logging error without crashing the socket thread
            import logging
            logging.error(f"[presence] DB Update Error: {e}")

# Global instance
presence_manager = PresenceManager()
