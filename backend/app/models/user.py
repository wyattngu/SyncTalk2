# backend/app/models/user.py

import uuid
from datetime import datetime, timezone
from app import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    profile_image_url = db.Column(db.String(300), nullable=True)
    is_online = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    threads = db.relationship('Thread', backref='author', lazy=True, foreign_keys='Thread.author_id', cascade='all, delete-orphan')
    replies = db.relationship('Reply', backref='author', lazy=True, foreign_keys='Reply.author_id', cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='user', lazy=True, cascade='all, delete-orphan')
    sent_messages = db.relationship('Message', backref='sender', lazy=True, foreign_keys='Message.sender_id', cascade='all, delete-orphan')
    received_messages = db.relationship('Message', backref='receiver', lazy=True, foreign_keys='Message.receiver_id', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username}>'