# backend/app/controllers/auth_controller.py

from flask import Blueprint, request
from app.services.auth_service import AuthService
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data:
        return error_response('No data provided', 400)

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return error_response('Username, email and password are required', 400)

    user, error = auth_service.register(username, email, password)
    if error:
        return error_response(error, 409)

    return success_response(
        data={
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'profile_image_url': user.profile_image_url,
            'created_at': (user.created_at.isoformat() + 'Z') if user.created_at else None
        },
        message='User registered successfully',
        status_code=201
    )

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return error_response('No data provided', 400)

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return error_response('Email and password are required', 400)

    user, token, error = auth_service.login(email, password)
    if error:
        return error_response(error, 401)
    return success_response(
        data={
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile_image_url': user.profile_image_url,
                'is_online': user.is_online
            }
        },
        message='Login successful'
    )

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return success_response(
        data={
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'profile_image_url': current_user.profile_image_url,
            'is_online': current_user.is_online,
            'created_at': (current_user.created_at.isoformat() + 'Z') if current_user.created_at else None,
            'last_seen': (current_user.last_seen.isoformat() + 'Z') if current_user.last_seen else None
        }
    )

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()

    if not data:
        return error_response('No data provided', 400)

    user, error = auth_service.update_profile(current_user.id, data)
    if error:
        return error_response(error, 404)

    return success_response(
        data={
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'profile_image_url': user.profile_image_url
        },
        message='Profile updated successfully'
    )

@auth_bp.route('/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    from app.repositories.user_repository import UserRepository
    user_repo = UserRepository()
    users = user_repo.get_all()
    return success_response(
        data=[{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'profile_image_url': u.profile_image_url,
            'is_online': u.is_online
        } for u in users if u.id != current_user.id]
    )

@auth_bp.route('/users/online', methods=['GET'])
@token_required
def get_users_with_status(current_user):
    from app.repositories.user_repository import UserRepository
    from datetime import datetime, timezone, timedelta
    user_repo = UserRepository()
    users = user_repo.get_all()

    def format_last_seen(last_seen):
        if not last_seen:
            return 'Không rõ'
        now = datetime.now(timezone.utc)
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
        diff = now - last_seen
        minutes = int(diff.total_seconds() / 60)
        if minutes < 1:
            return 'Vừa xong'
        if minutes < 60:
            return f'{minutes} phút trước'
        hours = minutes // 60
        if hours < 24:
            return f'{hours} giờ trước'
        days = hours // 24
        return f'{days} ngày trước'

    return success_response(
        data=[{
            'id': u.id,
            'username': u.username,
            'is_online': u.is_online,
            'last_seen': format_last_seen(u.last_seen)
        } for u in users if u.id != current_user.id]
    )