# backend/app/models/reply.py

import uuid
from datetime import datetime, timezone
from app import db

class Reply(db.Model):
    __tablename__ = 'replies'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = db.Column(db.String(36), db.ForeignKey('threads.id'), nullable=False, index=True)
    author_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<Reply {self.id}>'