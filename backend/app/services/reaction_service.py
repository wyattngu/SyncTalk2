from app.repositories.reaction_repository import ReactionRepository
from app.repositories.notification_repository import NotificationRepository

reaction_repo = ReactionRepository()
notif_repo = NotificationRepository()

ALLOWED_TARGET_TYPES = {'thread', 'reply'}
ALLOWED_EMOJIS = {'👍', '❤️', '🎉', '🤔', '😄', '🚀'}


class ReactionService:

    def toggle(self, user_id, target_type, target_id, emoji):
        if target_type not in ALLOWED_TARGET_TYPES:
            return None, 'Invalid target type'
        if emoji not in ALLOWED_EMOJIS:
            return None, 'Emoji not in allowed set'

        existing = reaction_repo.find(user_id, target_type, target_id, emoji)
        if existing:
            reaction_repo.remove(user_id, target_type, target_id, emoji)
            return {'state': 'removed', 'emoji': emoji}, None

        reaction_repo.add(user_id, target_type, target_id, emoji)
        self._notify(user_id, target_type, target_id, emoji)
        return {'state': 'added', 'emoji': emoji}, None

    def _notify(self, reactor_id, target_type, target_id, emoji):
        try:
            from app.models import User, Reply, Thread
            reactor = User.query.filter_by(id=reactor_id).first()
            name = reactor.username if reactor else 'Someone'

            if target_type == 'reply':
                reply = Reply.query.filter_by(id=target_id).first()
                if reply and reply.author_id != reactor_id:
                    notif_repo.create(
                        user_id=reply.author_id,
                        type='reaction',
                        message=f'{name} reacted {emoji} to your comment',
                        reference_id=reply.thread_id,
                    )
            elif target_type == 'thread':
                thread = Thread.query.filter_by(id=target_id).first()
                if thread and thread.author_id != reactor_id:
                    notif_repo.create(
                        user_id=thread.author_id,
                        type='reaction',
                        message=f'{name} reacted {emoji} to your thread',
                        reference_id=thread.id,
                    )
        except Exception:
            pass

    def list_for_target(self, target_type, target_id):
        if target_type not in ALLOWED_TARGET_TYPES:
            return None, 'Invalid target type'
        return reaction_repo.list_for_target(target_type, target_id), None
