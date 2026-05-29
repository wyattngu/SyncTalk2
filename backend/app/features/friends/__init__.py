# backend/app/features/friends/__init__.py
#
# Friends feature: send / accept / decline / cancel friend requests, list
# friends and pending requests, and report the friendship relation between
# two users.
#
# Public API:
#   - model:      Friendship, FriendshipStatus
#   - controller: friend_bp (Flask blueprint)
#
# Internal layout mirrors the rest of the app (model, repository, service,
# controller) so a reader can drop in and find everything in one place.

from .controller import friend_bp
from .model import Friendship, FriendshipStatus
from .service import FriendshipService

__all__ = [
    'friend_bp',
    'Friendship',
    'FriendshipStatus',
    'FriendshipService',
]
