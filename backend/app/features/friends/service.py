# backend/app/features/friends/service.py

from app.repositories.notification_repository import NotificationRepository
from app.repositories.user_repository import UserRepository

from .model import FriendshipStatus
from .repository import FriendshipRepository


# Notification.type values written by this service. Keep aligned with the
# frontend's NotificationType enum (frontend/src/constants/notification.ts).
NOTIF_TYPE_FRIEND_REQUEST = 'friend_request'
NOTIF_TYPE_FRIEND_ACCEPT = 'friend_accept'


friendship_repo = FriendshipRepository()
user_repo = UserRepository()
notif_repo = NotificationRepository()


class FriendshipService:

    def send_request(self, requester_id, addressee_id):
        if requester_id == addressee_id:
            return None, 'You cannot send a friend request to yourself'

        addressee = user_repo.find_by_id(addressee_id)
        if not addressee:
            return None, 'User not found'

        existing = friendship_repo.find_between(requester_id, addressee_id)
        if existing:
            if existing.status == FriendshipStatus.ACCEPTED:
                return None, 'You are already friends'
            if existing.status == FriendshipStatus.PENDING:
                return None, 'A friend request between you is already pending'
            # DECLINED — allow a fresh attempt.
            friendship_repo.delete(existing)

        friendship = friendship_repo.create(requester_id, addressee_id)

        notif_repo.create(
            user_id=addressee_id,
            type=NOTIF_TYPE_FRIEND_REQUEST,
            message='You have a new friend request',
            reference_id=requester_id,
        )

        return friendship, None

    def accept_request(self, request_id, current_user_id):
        friendship, error = self._fetch_pending_for_addressee(
            request_id, current_user_id
        )
        if error:
            return None, error

        friendship_repo.update_status(friendship, FriendshipStatus.ACCEPTED)

        notif_repo.create(
            user_id=friendship.requester_id,
            type=NOTIF_TYPE_FRIEND_ACCEPT,
            message='Your friend request was accepted',
            reference_id=current_user_id,
        )

        return friendship, None

    def decline_request(self, request_id, current_user_id):
        friendship, error = self._fetch_pending_for_addressee(
            request_id, current_user_id
        )
        if error:
            return None, error

        friendship_repo.update_status(friendship, FriendshipStatus.DECLINED)
        return friendship, None

    def cancel_request(self, request_id, current_user_id):
        friendship = friendship_repo.find_by_id(request_id)
        if not friendship:
            return None, 'Request not found'
        if friendship.requester_id != current_user_id:
            return None, 'You can only cancel requests you sent'
        if friendship.status != FriendshipStatus.PENDING:
            return None, 'Request is no longer pending'

        friendship_repo.delete(friendship)
        return True, None

    def unfriend(self, current_user_id, other_user_id):
        friendship = friendship_repo.find_between(current_user_id, other_user_id)
        if not friendship or friendship.status != FriendshipStatus.ACCEPTED:
            return None, 'You are not friends with this user'
        friendship_repo.delete(friendship)
        return True, None

    def get_relation(self, current_user_id, other_user_id):
        """Return the directional relationship from current_user's perspective.

        Possible relation values:
          - self          (looking at own profile)
          - none          (no row, or DECLINED)
          - pending_out   (current user sent the request)
          - pending_in    (current user received the request)
          - friends       (ACCEPTED row exists)
        """
        if current_user_id == other_user_id:
            return {'relation': 'self', 'request_id': None}

        friendship = friendship_repo.find_between(current_user_id, other_user_id)
        if not friendship:
            return {'relation': 'none', 'request_id': None}

        if friendship.status == FriendshipStatus.ACCEPTED:
            return {'relation': 'friends', 'request_id': friendship.id}

        if friendship.status == FriendshipStatus.PENDING:
            if friendship.requester_id == current_user_id:
                return {'relation': 'pending_out', 'request_id': friendship.id}
            return {'relation': 'pending_in', 'request_id': friendship.id}

        # DECLINED is treated as no relationship so a new request can be sent.
        return {'relation': 'none', 'request_id': None}

    def list_friends(self, user_id):
        return friendship_repo.list_friends_for(user_id)

    def list_pending(self, user_id):
        return friendship_repo.list_pending_for(user_id)

    def count_friends(self, user_id):
        return friendship_repo.count_friends(user_id)

    def _fetch_pending_for_addressee(self, request_id, current_user_id):
        friendship = friendship_repo.find_by_id(request_id)
        if not friendship:
            return None, 'Request not found'
        if friendship.addressee_id != current_user_id:
            return None, 'You can only respond to requests sent to you'
        if friendship.status != FriendshipStatus.PENDING:
            return None, 'Request is no longer pending'
        return friendship, None
