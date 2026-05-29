from flask import Blueprint, request
from app.models.tag import Tag, ThreadTag
from app.models.thread import Thread
from app.utils.response import success_response, error_response

tag_bp = Blueprint('tag', __name__, url_prefix='/api/tags')

@tag_bp.route('', methods=['GET'])
def get_all_tags():
    from app import db
    tags = Tag.query.all()
    return success_response(
        data=[{
            'id': t.id,
            'name': t.name,
            'slug': t.slug
        } for t in tags]
    )
@tag_bp.route('/<slug>/threads', methods=['GET'])
def get_threads_by_tag(slug):
    tag = Tag.query.filter_by(slug=slug).first()
    if not tag:
        return error_response('Tag not found', 404)

    thread_tags = ThreadTag.query.filter_by(tag_id=tag.id).all()
    thread_ids = [tt.thread_id for tt in thread_tags]
    threads = Thread.query.filter(Thread.id.in_(thread_ids)).order_by(
        Thread.is_pinned.desc(), Thread.created_at.desc()
    ).all()

    return success_response(
        data=[{
            'id': t.id,
            'author_id': t.author_id,
            'title': t.title,
            'content': t.content,
            'image_url': t.image_url,
            'reply_count': t.reply_count,
            'like_count': t.like_count,
            'is_pinned': t.is_pinned,
            'created_at': (t.created_at.isoformat() + 'Z') if t.created_at else None
        } for t in threads]
    )