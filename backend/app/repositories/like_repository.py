# backend/app/repositories/like_repository.py

from app import db
from app.models.like import Like

class LikeRepository:

    def create(self, user_id, thread_id):
        like = Like(
            user_id=user_id,
            thread_id=thread_id
        )
        db.session.add(like)
        db.session.commit()
        return like

    def find(self, user_id, thread_id):
        return Like.query.filter_by(user_id=user_id, thread_id=thread_id).first()

    def get_by_thread(self, thread_id):
        return Like.query.filter_by(thread_id=thread_id).all()

    def get_by_user(self, user_id):
        return Like.query.filter_by(user_id=user_id).all()

    def delete(self, user_id, thread_id):
        like = self.find(user_id, thread_id)
        if like:
            db.session.delete(like)
            db.session.commit()
        return like