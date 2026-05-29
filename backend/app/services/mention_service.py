"""Parse @username mentions from text and create notifications."""

import re
from app.repositories.user_repository import UserRepository
from app.repositories.notification_repository import NotificationRepository

MENTION_RE = re.compile(r'@([A-Za-z0-9_]{2,30})')

user_repo = UserRepository()
notif_repo = NotificationRepository()


class MentionService:

    def extract_usernames(self, text):
        if not text:
            return []
        return list({m.lower() for m in MENTION_RE.findall(text)})

    def notify_mentions(self, text, *, by_user_id, reference_id, in_reply=False):
        """For each unique @username in text, create a 'mention' notification.

        Skips: the author themselves, unknown usernames, duplicates.
        Returns the list of mentioned User objects (already deduped).
        """
        usernames = self.extract_usernames(text)
        if not usernames:
            return []

        actor = user_repo.find_by_id(by_user_id)
        actor_username = (actor.username if actor else '').lower()

        notified = []
        for uname in usernames:
            if uname == actor_username:
                continue
            target = user_repo.find_by_username_ci(uname)
            if not target:
                continue
            if target.id == by_user_id:
                continue
            verb = 'mentioned you in a reply' if in_reply else 'mentioned you in a thread'
            notif_repo.create(
                user_id=target.id,
                type='mention',
                message=f"{actor.username if actor else 'Someone'} {verb}",
                reference_id=reference_id,
            )
            notified.append(target)
        return notified
