# backend/app/features/friends/model.py

import enum
import uuid
from datetime import datetime, timezone

from app import db


class FriendshipStatus(enum.Enum):
    """The lifecycle state of a friendship row.

    PENDING  — request sent, awaiting addressee's response
    ACCEPTED — both users are friends
    DECLINED — addressee rejected; row kept for history but the requester may
               re-send (the service deletes the old row before re-creating)
    """
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    DECLINED = 'declined'


class Friendship(db.Model):
    """Directed friendship row.

    `requester_id` initiated the request; `addressee_id` must accept or
    decline. Once ACCEPTED the relationship is treated as symmetric — the
    repository's find_between() ignores direction.
    """
    __tablename__ = 'friendships'

    id = db.Column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    requester_id = db.Column(
        db.String(36), db.ForeignKey('users.id'), nullable=False, index=True
    )
    addressee_id = db.Column(
        db.String(36), db.ForeignKey('users.id'), nullable=False, index=True
    )
    status = db.Column(
        db.Enum(
            FriendshipStatus,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=FriendshipStatus.PENDING,
        nullable=False,
    )
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    responded_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (
        db.UniqueConstraint(
            'requester_id', 'addressee_id', name='uq_friendship_pair'
        ),
    )

    def __repr__(self):
        return (
            f'<Friendship {self.requester_id}->{self.addressee_id} '
            f'{self.status.value}>'
        )
