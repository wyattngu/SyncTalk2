# backend/app/models/tag.py

import uuid
from app import db

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), nullable=False, unique=True)
    slug = db.Column(db.String(50), nullable=False, unique=True)

    thread_tags = db.relationship('ThreadTag', backref='tag', lazy=True)

    def __repr__(self):
        return f'<Tag {self.name}>'


class ThreadTag(db.Model):
    __tablename__ = 'thread_tags'

    thread_id = db.Column(db.String(36), db.ForeignKey('threads.id'), primary_key=True)
    tag_id = db.Column(db.String(36), db.ForeignKey('tags.id'), primary_key=True)

    def __repr__(self):
        return f'<ThreadTag {self.thread_id} - {self.tag_id}>'