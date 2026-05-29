# backend/app/__init__.py
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*") # Cho phép tất cả các nguồn kết nối