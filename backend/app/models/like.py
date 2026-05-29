# backend/app/models/like.py

import uuid
from datetime import datetime, timezone
from app import db

class Like(db.Model):
    __tablename__ = 'likes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    thread_id = db.Column(db.String(36), db.ForeignKey('threads.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<Like {self.id}>'