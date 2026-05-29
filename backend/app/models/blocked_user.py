# backend/app/models/blocked_user.py

import uuid
from datetime import datetime, timezone
from app import db

class BlockedUser(db.Model):
    __tablename__ = 'blocked_users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blocker_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    blocked_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    blocker = db.relationship('User', foreign_keys=[blocker_id], backref='blocking')
    blocked = db.relationship('User', foreign_keys=[blocked_id], backref='blocked_by')

    def __repr__(self):
        return f'<BlockedUser {self.blocker_id} blocked {self.blocked_id}>'