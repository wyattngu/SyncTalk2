# backend/app/models/ai_chat_message.py

import uuid
from datetime import datetime, timezone
from app import db

class AIChatMessage(db.Model):
    __tablename__ = 'ai_chat_messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('ai_messages', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat() + 'Z'
        }

    def __repr__(self):
        return f'<AIChatMessage {self.role}: {self.content[:20]}...>'
