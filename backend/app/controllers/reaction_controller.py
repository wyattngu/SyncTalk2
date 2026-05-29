from flask import Blueprint, request
from app.services.reaction_service import ReactionService, ALLOWED_EMOJIS
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response

reaction_bp = Blueprint('reactions', __name__, url_prefix='/api/reactions')
reaction_service = ReactionService()


@reaction_bp.route('', methods=['POST'])
@token_required
def toggle_reaction(current_user):
    data = request.get_json() or {}
    target_type = data.get('target_type')
    target_id = data.get('target_id')
    emoji = data.get('emoji')

    if not target_type or not target_id or not emoji:
        return error_response('target_type, target_id and emoji are required', 400)

    result, err = reaction_service.toggle(
        current_user.id, target_type, target_id, emoji
    )
    if err:
        return error_response(err, 400)

    aggregated, _ = reaction_service.list_for_target(target_type, target_id)
    return success_response(
        data={'toggle': result, 'reactions': aggregated}
    )


@reaction_bp.route('', methods=['GET'])
def list_reactions():
    target_type = request.args.get('target_type')
    target_id = request.args.get('target_id')
    if not target_type or not target_id:
        return error_response('target_type and target_id are required', 400)

    aggregated, err = reaction_service.list_for_target(target_type, target_id)
    if err:
        return error_response(err, 400)

    return success_response(data=aggregated)


@reaction_bp.route('/allowed', methods=['GET'])
def list_allowed_emojis():
    return success_response(data=sorted(list(ALLOWED_EMOJIS)))
