# backend/app/features/friends/controller.py

from flask import Blueprint, request

from app.utils.jwt_helper import token_required
from app.utils.response import error_response, success_response

from .service import FriendshipService

friend_bp = Blueprint('friend', __name__, url_prefix='/api/friends')
friendship_service = FriendshipService()


def _user_summary(user):
    return {
        'id': user.id,
        'username': user.username,
        'profile_image_url': user.profile_image_url,
        'is_online': user.is_online,
    }


def _friendship_summary(friendship, other_user, direction=None):
    payload = {
        'request_id': friendship.id,
        'status': friendship.status.value,
        'created_at': str(friendship.created_at),
        'user': _user_summary(other_user),
    }
    if direction is not None:
        payload['direction'] = direction
    return payload


@friend_bp.route('/requests', methods=['POST'])
@token_required
def send_request(current_user):
    data = request.get_json() or {}
    addressee_id = data.get('user_id')
    if not addressee_id:
        return error_response('user_id is required', 400)

    friendship, error = friendship_service.send_request(
        current_user.id, addressee_id
    )
    if error:
        return error_response(error, 400)

    return success_response(
        data={
            'request_id': friendship.id,
            'status': friendship.status.value,
            'created_at': str(friendship.created_at),
        },
        message='Friend request sent',
        status_code=201,
    )


@friend_bp.route('/requests/<request_id>/accept', methods=['POST'])
@token_required
def accept_request(current_user, request_id):
    friendship, error = friendship_service.accept_request(
        request_id, current_user.id
    )
    if error:
        return error_response(error, 400)
    return success_response(
        data={
            'request_id': friendship.id,
            'status': friendship.status.value,
        },
        message='Friend request accepted',
    )


@friend_bp.route('/requests/<request_id>/decline', methods=['POST'])
@token_required
def decline_request(current_user, request_id):
    friendship, error = friendship_service.decline_request(
        request_id, current_user.id
    )
    if error:
        return error_response(error, 400)
    return success_response(
        data={
            'request_id': friendship.id,
            'status': friendship.status.value,
        },
        message='Friend request declined',
    )


@friend_bp.route('/requests/<request_id>', methods=['DELETE'])
@token_required
def cancel_request(current_user, request_id):
    _, error = friendship_service.cancel_request(request_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Friend request cancelled')


@friend_bp.route('/<user_id>', methods=['DELETE'])
@token_required
def unfriend(current_user, user_id):
    _, error = friendship_service.unfriend(current_user.id, user_id)
    if error:
        return error_response(error, 400)
    return success_response(message='Unfriended successfully')


@friend_bp.route('', methods=['GET'])
@friend_bp.route('/', methods=['GET'])
@token_required
def list_friends(current_user):
    rows = friendship_service.list_friends(current_user.id)
    return success_response(
        data=[_friendship_summary(row, other) for row, other in rows]
    )


@friend_bp.route('/pending', methods=['GET'])
@token_required
def list_pending(current_user):
    rows = friendship_service.list_pending(current_user.id)
    incoming = []
    outgoing = []
    for row, other, direction in rows:
        item = _friendship_summary(row, other, direction)
        (incoming if direction == 'in' else outgoing).append(item)
    return success_response(data={'incoming': incoming, 'outgoing': outgoing})


@friend_bp.route('/status/<user_id>', methods=['GET'])
@token_required
def get_status(current_user, user_id):
    relation = friendship_service.get_relation(current_user.id, user_id)
    return success_response(data=relation)
