# backend/app/models/message.py

import uuid
from datetime import datetime, timezone
from app import db

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    receiver_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=True)  # nullable khi gửi ảnh không kèm text
    image_url = db.Column(db.String(300), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    is_ai = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    edited_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<Message {self.id}>'