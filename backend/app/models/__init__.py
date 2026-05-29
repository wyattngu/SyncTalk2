from .user import User
from .thread import Thread
from .reply import Reply
from .like import Like
from .message import Message
from .notification import Notification
from .tag import Tag, ThreadTag
from .blocked_user import BlockedUser
from .reaction import Reaction
from .ai_chat_message import AIChatMessage

# Feature-folder models — re-exported here so SQLAlchemy registers the
# tables when models/ is imported during app startup.
from app.features.friends.model import Friendship, FriendshipStatus
