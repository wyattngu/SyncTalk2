# backend/app/repositories/message_repository.py

from app import db
from app.models.message import Message
from datetime import datetime, timezone

class MessageRepository:

    def create(self, sender_id, receiver_id, content, image_url=None, is_ai=False):
        new_message = Message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content,
            image_url=image_url,
            is_ai=is_ai,
        )
        db.session.add(new_message)
        db.session.commit()
        return new_message


    def find_by_id(self, message_id):
        return Message.query.filter_by(id=message_id).first()

    def get_conversation(self, user1_id, user2_id):
        return Message.query.filter(
            ((Message.sender_id == user1_id) & (Message.receiver_id == user2_id)) |
            ((Message.sender_id == user2_id) & (Message.receiver_id == user1_id))
        ).order_by(Message.created_at.asc()).all()

    def get_unread(self, receiver_id):
        return Message.query.filter_by(receiver_id=receiver_id, is_read=False).all()

    def mark_as_read(self, sender_id, receiver_id):
        messages = Message.query.filter_by(
            sender_id=sender_id,
            receiver_id=receiver_id,
            is_read=False
        ).all()
        for message in messages:
            message.is_read = True
        db.session.commit()
        return messages

    def update_content(self, message_id, content):
        message = self.find_by_id(message_id)
        if message:
            message.content = content
            message.edited_at = datetime.now(timezone.utc)
            db.session.commit()
        return message

    def delete(self, message_id):
        message = self.find_by_id(message_id)
        if message:
            db.session.delete(message)
            db.session.commit()
        return message

    def latest_between(self, user_a_id, user_b_id):
        return Message.query.filter(
            ((Message.sender_id == user_a_id) & (Message.receiver_id == user_b_id)) |
            ((Message.sender_id == user_b_id) & (Message.receiver_id == user_a_id))
        ).order_by(Message.created_at.desc()).first()

    def count_unread_from(self, sender_id, receiver_id):
        return Message.query.filter_by(
            sender_id=sender_id,
            receiver_id=receiver_id,
            is_read=False,
        ).count()