# backend/app/features/friends/repository.py

from datetime import datetime, timezone

from sqlalchemy import and_, or_

from app import db
from app.models.user import User
from .model import Friendship, FriendshipStatus


class FriendshipRepository:

    def find_by_id(self, friendship_id):
        return Friendship.query.filter_by(id=friendship_id).first()

    def find_between(self, user_a, user_b):
        """Return the friendship row between two users, in either direction."""
        return Friendship.query.filter(
            or_(
                and_(
                    Friendship.requester_id == user_a,
                    Friendship.addressee_id == user_b,
                ),
                and_(
                    Friendship.requester_id == user_b,
                    Friendship.addressee_id == user_a,
                ),
            )
        ).first()

    def create(self, requester_id, addressee_id):
        row = Friendship(
            requester_id=requester_id,
            addressee_id=addressee_id,
            status=FriendshipStatus.PENDING,
        )
        db.session.add(row)
        db.session.commit()
        return row

    def update_status(self, friendship, status):
        friendship.status = status
        friendship.responded_at = datetime.now(timezone.utc)
        db.session.commit()
        return friendship

    def delete(self, friendship):
        db.session.delete(friendship)
        db.session.commit()

    def list_friends_for(self, user_id):
        """Return [(row, other_user), ...] for accepted friendships."""
        rows = (
            Friendship.query.filter(
                Friendship.status == FriendshipStatus.ACCEPTED,
                or_(
                    Friendship.requester_id == user_id,
                    Friendship.addressee_id == user_id,
                ),
            )
            .order_by(Friendship.responded_at.desc())
            .all()
        )
        results = []
        for row in rows:
            other_id = (
                row.addressee_id
                if row.requester_id == user_id
                else row.requester_id
            )
            other = User.query.get(other_id)
            if other:
                results.append((row, other))
        return results

    def list_pending_for(self, user_id):
        """Return [(row, other_user, direction), ...] for pending requests.

        direction is 'in' if `user_id` is the addressee, 'out' if requester.
        """
        rows = (
            Friendship.query.filter(
                Friendship.status == FriendshipStatus.PENDING,
                or_(
                    Friendship.requester_id == user_id,
                    Friendship.addressee_id == user_id,
                ),
            )
            .order_by(Friendship.created_at.desc())
            .all()
        )
        results = []
        for row in rows:
            if row.requester_id == user_id:
                other = User.query.get(row.addressee_id)
                direction = 'out'
            else:
                other = User.query.get(row.requester_id)
                direction = 'in'
            if other:
                results.append((row, other, direction))
        return results

    def count_friends(self, user_id):
        return Friendship.query.filter(
            Friendship.status == FriendshipStatus.ACCEPTED,
            or_(
                Friendship.requester_id == user_id,
                Friendship.addressee_id == user_id,
            ),
        ).count()
