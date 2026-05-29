# backend/app/services/user_service.py

from app.features.friends import FriendshipService
from app.models.thread import Thread
from app.repositories.blocked_user_repository import BlockedUserRepository
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.blocked_repo = BlockedUserRepository()
        self.friendship_service = FriendshipService()

    def get_public_profile(self, viewer_id, target_id):
        """Profile data exposed to anyone who can view the user.

        Includes the directional friend relation and block status with the
        viewer so the frontend can render the right action buttons without
        a second round-trip.
        """
        user = self.user_repo.find_by_id(target_id)
        if not user:
            return None, 'User not found'

        is_blocked_by_me, is_blocked_by_them = self.check_if_blocked(
            viewer_id, target_id
        )
        relation = self.friendship_service.get_relation(viewer_id, target_id)
        threads = (
            Thread.query.filter_by(author_id=target_id)
            .order_by(Thread.created_at.desc())
            .all()
        )
        thread_count = len(threads)
        friend_count = self.friendship_service.count_friends(target_id)

        from app.sockets.presence_manager import presence_manager
        return {
            'id': user.id,
            'username': user.username,
            'profile_image_url': user.profile_image_url,
            'is_online': presence_manager.is_user_online(user.id),
            'created_at': str(user.created_at),
            'last_seen': str(user.last_seen) if user.last_seen else None,
            'thread_count': thread_count,
            'friend_count': friend_count,
            'threads': [
                {
                    'id': t.id,
                    'title': t.title,
                    'content': t.content,
                    'image_url': t.image_url,
                    'reply_count': t.reply_count,
                    'like_count': t.like_count,
                    'created_at': (t.created_at.isoformat() + 'Z') if t.created_at else None,
                }
                for t in threads
            ],
            'friendship': relation,
            'block': {
                'is_blocked_by_me': is_blocked_by_me,
                'is_blocked_by_them': is_blocked_by_them,
            },
            'is_self': viewer_id == target_id,
        }, None

    def block_user(self, blocker_id, blocked_id):
        if blocker_id == blocked_id:
            return None, "Cannot block yourself"
        
        target_user = self.user_repo.find_by_id(blocked_id)
        if not target_user:
            return None, "Target user not found"

        if self.blocked_repo.is_blocked(blocker_id, blocked_id):
            return None, "User is already blocked"

        blocked = self.blocked_repo.create(blocker_id, blocked_id)
        return blocked, None

    def unblock_user(self, blocker_id, blocked_id):
        target_user = self.user_repo.find_by_id(blocked_id)
        if not target_user:
            return False, "Target user not found"

        if not self.blocked_repo.is_blocked(blocker_id, blocked_id):
            return False, "User is not blocked"

        self.blocked_repo.delete(blocker_id, blocked_id)
        return True, None

    def get_blocked_users(self, blocker_id):
        blocked_list = self.blocked_repo.get_blocked_list(blocker_id)
        
        # Format the response with user details
        result = []
        for b in blocked_list:
            blocked_user = self.user_repo.find_by_id(b.blocked_id)
            if blocked_user:
                result.append({
                    'id': blocked_user.id,
                    'username': blocked_user.username,
                    'profile_image_url': blocked_user.profile_image_url,
                    'blocked_at': str(b.created_at)
                })
        return result, None

    def check_if_blocked(self, user_id, target_id):
        """
        Check if user_id has blocked target_id OR target_id has blocked user_id.
        Returns a tuple (is_blocked_by_me, is_blocked_by_them)
        """
        is_blocked_by_me = self.blocked_repo.is_blocked(user_id, target_id)
        is_blocked_by_them = self.blocked_repo.is_blocked(target_id, user_id)
        return is_blocked_by_me, is_blocked_by_them
