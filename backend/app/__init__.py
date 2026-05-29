# backend/app/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_socketio import SocketIO


db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
socketio = SocketIO()

def create_app():
    import os
    static_folder = os.path.join(os.path.dirname(__file__), '..', 'static')
    app = Flask(__name__, static_folder=static_folder, static_url_path='/static')

    from config import Config
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    allowed_origins = os.getenv('FRONTEND_URL', 'http://localhost:4000').split(',')
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
    socketio.init_app(app, cors_allowed_origins=allowed_origins, async_mode="eventlet")

    from app import models

    from app.controllers.auth_controller import auth_bp
    from app.controllers.thread_controller import thread_bp
    from app.controllers.message_controller import message_bp
    from app.controllers.notification_controller import notification_bp
    from app.controllers.tag_controller import tag_bp
    from app.controllers.upload_controller import upload_bp
    from app.controllers.user_controller import user_bp
    from app.controllers.ai_controller import ai_bp
    from app.controllers.reaction_controller import reaction_bp
    # Feature-folder blueprints — see app/features/<name>/controller.py
    from app.features.friends import friend_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(thread_bp)
    app.register_blueprint(message_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(tag_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(reaction_bp)
    app.register_blueprint(friend_bp)

    return app

from app.sockets import message_socket, notification_socket, presence_socket