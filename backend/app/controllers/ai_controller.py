# backend/app/controllers/ai_controller.py

from flask import Blueprint, request
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response
from app.services.summarization_service import SummarizationService
from app.services.semantic_search_service import SemanticSearchService

from app.utils.ai_helper import generate_with_retry, throttle_user

from app import db
from app.models.ai_chat_message import AIChatMessage

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
summarization_service = SummarizationService()
search_service = SemanticSearchService()


@ai_bp.route('/chatbot/history', methods=['GET'])
@token_required
def get_chatbot_history(current_user):
    messages = AIChatMessage.query.filter_by(user_id=current_user.id).order_by(AIChatMessage.created_at.asc()).all()
    return success_response(data=[m.to_dict() for m in messages])


@ai_bp.route('/chat', methods=['POST'])
@token_required
def chat(current_user):
    try:
        data = request.get_json()
        if not data:
            return error_response('No data provided', 400)

        # 1. Throttling check
        allowed, throttle_msg = throttle_user(current_user.id)
        if not allowed:
            return error_response(throttle_msg, 429)

        question = data.get('question', '').strip()
        if not question:
            return error_response('Question is required', 400)

        # 2. Save user message to DB
        user_msg = AIChatMessage(user_id=current_user.id, role='user', content=question)
        db.session.add(user_msg)
        db.session.commit()

        # 3. Fetch history for context (last 5 messages for maximum speed)
        history = AIChatMessage.query.filter_by(user_id=current_user.id).order_by(AIChatMessage.created_at.desc()).limit(5).all()
        history = history[::-1] # back to chronological

        # 4. Build prompt and history for Gemini
        # Gemini roles must be 'user' and 'model'
        gemini_history = []
        for m in history[:-1]: # exclude the current question we just saved
            gemini_history.append({
                "role": "user" if m.role == "user" else "model",
                "parts": [m.content]
            })
        
        system_instruction = (
            "Bạn là SyncBot, trợ lý AI thông minh, hữu ích và thân thiện trên nền tảng SyncTalk. "
            "Hãy trả lời một cách tự nhiên, chân thành bằng tiếng Việt."
        )
        
        full_prompt = f"{system_instruction}\n\nNgười dùng {current_user.username} hỏi: {question}"

        # 5. Generate with AI
        answer, err = generate_with_retry(full_prompt, history=gemini_history)
        if err:
            return error_response(err, 429 if "hạn mức" in err.lower() or "429" in err else 500)

        # 6. Save assistant response to DB
        assistant_msg = AIChatMessage(user_id=current_user.id, role='assistant', content=answer)
        db.session.add(assistant_msg)
        db.session.commit()

        return success_response(data={'answer': answer, 'id': assistant_msg.id})
    except Exception as e:
        return error_response(f"Lỗi máy chủ: {str(e)}", 500)


# ── Feature 1: Thread summarization ─────────────────────────────────────────
@ai_bp.route('/threads/<thread_id>/summarize', methods=['POST'])
@token_required
def summarize_thread(current_user, thread_id):
    force = (request.args.get('force') or '').lower() in ('1', 'true', 'yes')
    data, err = summarization_service.get_or_generate(thread_id, force=force)
    if err:
        return error_response(err, 400 if 'not configured' not in err else 503)
    return success_response(data=data)


@ai_bp.route('/threads/<thread_id>/summary', methods=['GET'])
def get_thread_summary(thread_id):
    data, err = summarization_service.get_or_generate(thread_id, force=False)
    if err:
        # On read, only fail if the thread doesn't exist; missing API key just returns empty
        if 'not found' in err.lower():
            return error_response(err, 404)
        return success_response(data=None)
    return success_response(data=data)


# ── Feature 1: Semantic search ──────────────────────────────────────────────
@ai_bp.route('/search', methods=['GET'])
def semantic_search():
    q = request.args.get('q', '').strip()
    data, err = search_service.search(q)
    if err:
        return error_response(err, 400)
    return success_response(data=data)
