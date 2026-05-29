# backend/app/repositories/reply_repository.py

from app import db
from app.models.reply import Reply

class ReplyRepository:

    def create(self, thread_id, author_id, content):
        reply = Reply(
            thread_id=thread_id,
            author_id=author_id,
            content=content
        )
        db.session.add(reply)
        db.session.commit()
        return reply

    def find_by_id(self, reply_id):
        return Reply.query.filter_by(id=reply_id).first()

    def get_by_thread(self, thread_id):
        return Reply.query.filter_by(thread_id=thread_id).order_by(Reply.created_at.asc()).all()

    def get_by_author(self, author_id):
        return Reply.query.filter_by(author_id=author_id).order_by(Reply.created_at.desc()).all()

    def delete(self, reply_id):
        reply = self.find_by_id(reply_id)
        if reply:
            db.session.delete(reply)
            db.session.commit()
        return reply