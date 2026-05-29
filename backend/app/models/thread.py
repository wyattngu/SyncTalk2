# backend/app/models/thread.py

import uuid
from datetime import datetime, timezone
from app import db

class Thread(db.Model):
    __tablename__ = 'threads'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    author_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(300), nullable=True)
    reply_count = db.Column(db.Integer, default=0)
    like_count = db.Column(db.Integer, default=0)
    is_pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # AI summarization (Feature 1)
    summary = db.Column(db.Text, nullable=True)
    summary_key_points = db.Column(db.Text, nullable=True)  # JSON-encoded list[str]
    summary_sentiment = db.Column(db.String(16), nullable=True)
    summary_reply_count = db.Column(db.Integer, nullable=True)  # cache key
    summary_generated_at = db.Column(db.DateTime, nullable=True)

    replies = db.relationship('Reply', backref='thread', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='thread', lazy=True, cascade='all, delete-orphan')
    thread_tags = db.relationship('ThreadTag', backref='thread', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Thread {self.title}>'