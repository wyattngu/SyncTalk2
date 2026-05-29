import uuid
from datetime import datetime, timezone
from sqlalchemy import UniqueConstraint
from app import db


class Reaction(db.Model):
    __tablename__ = 'reactions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    target_type = db.Column(db.String(10), nullable=False)  # 'thread' | 'reply'
    target_id = db.Column(db.String(36), nullable=False)
    emoji = db.Column(db.String(16), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('user_id', 'target_type', 'target_id', 'emoji',
                         name='uq_user_target_emoji'),
    )

    def __repr__(self):
        return f'<Reaction {self.emoji} on {self.target_type}:{self.target_id}>'
