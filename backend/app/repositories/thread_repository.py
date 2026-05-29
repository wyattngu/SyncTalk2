# backend/app/repositories/thread_repository.py

from app import db
from app.models.thread import Thread

class ThreadRepository:

    def create(self, author_id, title, content, image_url=None):
        thread = Thread(
            author_id=author_id,
            title=title,
            content=content,
            image_url=image_url
        )
        db.session.add(thread)
        db.session.commit()
        return thread

    def find_by_id(self, thread_id):
        return Thread.query.filter_by(id=thread_id).first()

    def get_all(self):
        return Thread.query.order_by(Thread.is_pinned.desc(), Thread.created_at.desc()).all()

    def get_by_author(self, author_id):
        return Thread.query.filter_by(author_id=author_id).order_by(Thread.created_at.desc()).all()

    def update(self, thread_id, data):
        thread = self.find_by_id(thread_id)
        if thread:
            if 'title' in data:
                thread.title = data['title']
            if 'content' in data:
                thread.content = data['content']
            if 'image_url' in data:
                thread.image_url = data['image_url']
            if 'is_pinned' in data:
                thread.is_pinned = data['is_pinned']
            db.session.commit()
        return thread

    def increment_reply_count(self, thread_id):
        thread = self.find_by_id(thread_id)
        if thread:
            thread.reply_count += 1
            db.session.commit()
        return thread

    def decrement_reply_count(self, thread_id):
        thread = self.find_by_id(thread_id)
        if thread:
            thread.reply_count = max(0, thread.reply_count - 1)
            db.session.commit()
        return thread

    def increment_like_count(self, thread_id):
        thread = self.find_by_id(thread_id)
        if thread:
            thread.like_count += 1
            db.session.commit()
        return thread

    def decrement_like_count(self, thread_id):
        thread = self.find_by_id(thread_id)
        if thread:
            thread.like_count = max(0, thread.like_count - 1)
            db.session.commit()
        return thread

    def delete(self, thread_id):
        thread = self.find_by_id(thread_id)
        if thread:
            db.session.delete(thread)
            db.session.commit()
        return thread