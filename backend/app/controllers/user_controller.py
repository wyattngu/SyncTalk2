# backend/app/controllers/user_controller.py

from flask import Blueprint, request
from app.services.user_service import UserService
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response

user_bp = Blueprint('user', __name__, url_prefix='/api/users')
user_service = UserService()

@user_bp.route('/<target_id>/block', methods=['POST'])
@token_required
def block_user(current_user, target_id):
    blocked, error = user_service.block_user(current_user.id, target_id)
    if error:
        return error_response(error, 400)
    
    return success_response(
        message='User blocked successfully',
        status_code=201
    )

@user_bp.route('/<target_id>/unblock', methods=['POST'])
@token_required
def unblock_user(current_user, target_id):
    success, error = user_service.unblock_user(current_user.id, target_id)
    if error:
        return error_response(error, 400)
    
    return success_response(
        message='User unblocked successfully'
    )

@user_bp.route('/blocked', methods=['GET'])
@token_required
def get_blocked_users(current_user):
    users, error = user_service.get_blocked_users(current_user.id)
    if error:
        return error_response(error, 400)
    
    return success_response(data=users)

@user_bp.route('/<target_id>/status', methods=['GET'])
@token_required
def check_block_status(current_user, target_id):
    is_blocked_by_me, is_blocked_by_them = user_service.check_if_blocked(current_user.id, target_id)
    return success_response(
        data={
            'is_blocked_by_me': is_blocked_by_me,
            'is_blocked_by_them': is_blocked_by_them
        }
    )

@user_bp.route('/<target_id>/profile', methods=['GET'])
@token_required
def get_public_profile(current_user, target_id):
    profile, error = user_service.get_public_profile(current_user.id, target_id)
    if error:
        return error_response(error, 404)
    return success_response(data=profile)
