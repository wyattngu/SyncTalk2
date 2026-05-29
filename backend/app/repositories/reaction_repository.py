from collections import defaultdict
from app import db
from app.models.reaction import Reaction


class ReactionRepository:

    def find(self, user_id, target_type, target_id, emoji):
        return Reaction.query.filter_by(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
            emoji=emoji,
        ).first()

    def add(self, user_id, target_type, target_id, emoji):
        reaction = Reaction(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
            emoji=emoji,
        )
        db.session.add(reaction)
        db.session.commit()
        return reaction

    def remove(self, user_id, target_type, target_id, emoji):
        reaction = self.find(user_id, target_type, target_id, emoji)
        if reaction:
            db.session.delete(reaction)
            db.session.commit()

    def list_for_target(self, target_type, target_id):
        """Returns aggregated [{ emoji, count, user_ids }]."""
        rows = Reaction.query.filter_by(
            target_type=target_type,
            target_id=target_id,
        ).all()
        grouped = defaultdict(list)
        for r in rows:
            grouped[r.emoji].append(r.user_id)
        return [
            {'emoji': emoji, 'count': len(uids), 'user_ids': uids}
            for emoji, uids in sorted(grouped.items(), key=lambda kv: -len(kv[1]))
        ]
