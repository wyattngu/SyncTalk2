# backend/app/controllers/thread_controller.py

from flask import Blueprint, request
from app.models.user import User
from app.services.thread_service import ThreadService
from app.repositories.like_repository import LikeRepository
from app.repositories.user_repository import UserRepository
from app.utils.jwt_helper import token_required, optional_token
from app.utils.response import success_response, error_response

thread_bp = Blueprint('thread', __name__, url_prefix='/api/threads')
thread_service = ThreadService()
like_repo = LikeRepository()
user_repo = UserRepository()


def _load_author_map(threads):
    """Batch-load authors for a list of threads (avoids N+1 queries)."""
    ids = list({t.author_id for t in threads if t.author_id})
    if not ids:
        return {}
    return {u.id: u for u in User.query.filter(User.id.in_(ids)).all()}


def _serialize_thread(t, *, viewer_id=None, author=None):
    if author is None:
        author = user_repo.find_by_id(t.author_id)
    return {
        'id': t.id,
        'author_id': t.author_id,
        'author': {
            'id': author.id,
            'username': author.username,
            'profile_image_url': author.profile_image_url,
        } if author else None,
        'title': t.title,
        'content': t.content,
        'image_url': t.image_url,
        'reply_count': t.reply_count,
        'like_count': t.like_count,
        'is_pinned': t.is_pinned,
        'created_at': (t.created_at.isoformat() + 'Z') if t.created_at else None,
        'liked_by_me': bool(viewer_id and like_repo.find(viewer_id, t.id)),
        'has_summary': bool(t.summary),
    }


@thread_bp.route('', methods=['GET'])
@optional_token
def get_all_threads(current_user=None):
    threads, error = thread_service.get_all_threads()
    if error:
        return error_response(error, 400)
    viewer_id = current_user.id if current_user else None
    author_map = _load_author_map(threads)
    return success_response(
        data=[_serialize_thread(t, viewer_id=viewer_id, author=author_map.get(t.author_id)) for t in threads]
    )


@thread_bp.route('/mine', methods=['GET'])
@token_required
def get_my_threads(current_user):
    threads, error = thread_service.get_threads_by_author(current_user.id)
    if error:
        return error_response(error, 400)
    author_map = _load_author_map(threads)
    return success_response(
        data=[
            _serialize_thread(t, viewer_id=current_user.id, author=author_map.get(t.author_id))
            for t in threads
        ]
    )


@thread_bp.route('/<thread_id>', methods=['GET'])
@optional_token
def get_thread(current_user, thread_id):
    thread, error = thread_service.get_thread_by_id(thread_id)
    if error:
        return error_response(error, 404)
    viewer_id = current_user.id if current_user else None
    return success_response(data=_serialize_thread(thread, viewer_id=viewer_id))


@thread_bp.route('', methods=['POST'])
@token_required
def create_thread(current_user):
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    title = data.get('title')
    content = data.get('content')
    image_url = data.get('image_url')

    thread, error = thread_service.create_thread(current_user.id, title, content, image_url)
    if error:
        return error_response(error, 400)

    return success_response(
        data=_serialize_thread(thread, viewer_id=current_user.id),
        message='Thread created successfully',
        status_code=201,
    )


@thread_bp.route('/<thread_id>', methods=['PUT'])
@token_required
def update_thread(current_user, thread_id):
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    thread, error = thread_service.update_thread(thread_id, current_user.id, data)
    if error:
        return error_response(error, 400)

    return success_response(
        data=_serialize_thread(thread, viewer_id=current_user.id),
        message='Thread updated successfully',
    )


@thread_bp.route('/<thread_id>', methods=['DELETE'])
@token_required
def delete_thread(current_user, thread_id):
    result, error = thread_service.delete_thread(thread_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Thread deleted successfully')


@thread_bp.route('/<thread_id>/like', methods=['POST'])
@token_required
def like_thread(current_user, thread_id):
    like, error = thread_service.like_thread(current_user.id, thread_id)
    if error:
        return error_response(error, 400)
    thread, _ = thread_service.get_thread_by_id(thread_id)
    return success_response(
        data={'like_count': thread.like_count if thread else None, 'liked': True},
        message='Thread liked successfully',
    )


@thread_bp.route('/<thread_id>/unlike', methods=['DELETE'])
@token_required
def unlike_thread(current_user, thread_id):
    result, error = thread_service.unlike_thread(current_user.id, thread_id)
    if error:
        return error_response(error, 400)
    thread, _ = thread_service.get_thread_by_id(thread_id)
    return success_response(
        data={'like_count': thread.like_count if thread else None, 'liked': False},
        message='Thread unliked successfully',
    )


def _serialize_reply(r, *, author=None):
    if author is None:
        author = user_repo.find_by_id(r.author_id)
    return {
        'id': r.id,
        'thread_id': r.thread_id,
        'author_id': r.author_id,
        'author': {
            'id': author.id,
            'username': author.username,
            'profile_image_url': author.profile_image_url,
        } if author else None,
        'content': r.content,
        'created_at': (r.created_at.isoformat() + 'Z') if r.created_at else None,
    }


@thread_bp.route('/<thread_id>/related', methods=['GET'])
@optional_token
def get_related(thread_id, current_user=None):
    related, error = thread_service.get_related_threads(thread_id, limit=5)
    if error:
        return error_response(error, 404)
    viewer_id = current_user.id if current_user else None
    author_map = _load_author_map(related)
    return success_response(
        data=[_serialize_thread(t, viewer_id=viewer_id, author=author_map.get(t.author_id)) for t in related]
    )


@thread_bp.route('/<thread_id>/replies', methods=['GET'])
def get_replies(thread_id):
    replies, error = thread_service.get_replies_by_thread(thread_id)
    if error:
        return error_response(error, 404)
    ids = list({r.author_id for r in replies if r.author_id})
    author_map = {u.id: u for u in User.query.filter(User.id.in_(ids)).all()} if ids else {}
    return success_response(data=[_serialize_reply(r, author=author_map.get(r.author_id)) for r in replies])


@thread_bp.route('/<thread_id>/replies', methods=['POST'])
@token_required
def create_reply(current_user, thread_id):
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    content = data.get('content')
    reply, error = thread_service.create_reply(thread_id, current_user.id, content)
    if error:
        return error_response(error, 400)

    return success_response(
        data=_serialize_reply(reply),
        message='Reply created successfully',
        status_code=201,
    )


@thread_bp.route('/replies/<reply_id>', methods=['DELETE'])
@token_required
def delete_reply(current_user, reply_id):
    result, error = thread_service.delete_reply(reply_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Reply deleted successfully')
