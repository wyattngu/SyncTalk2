# backend/app/repositories/blocked_user_repository.py

from app import db
from app.models.blocked_user import BlockedUser

class BlockedUserRepository:

    def create(self, blocker_id, blocked_id):
        blocked = BlockedUser(
            blocker_id=blocker_id,
            blocked_id=blocked_id
        )
        db.session.add(blocked)
        db.session.commit()
        return blocked

    def find(self, blocker_id, blocked_id):
        return BlockedUser.query.filter_by(
            blocker_id=blocker_id,
            blocked_id=blocked_id
        ).first()

    def get_blocked_list(self, blocker_id):
        return BlockedUser.query.filter_by(blocker_id=blocker_id).all()

    def is_blocked(self, blocker_id, blocked_id):
        return self.find(blocker_id, blocked_id) is not None

    def delete(self, blocker_id, blocked_id):
        blocked = self.find(blocker_id, blocked_id)
        if blocked:
            db.session.delete(blocked)
            db.session.commit()
        return blocked