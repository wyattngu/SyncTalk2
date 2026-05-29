import os
import google.generativeai as genai
from app.services.message_service import MessageService
from app.repositories.user_repository import UserRepository

class AIService:
    def __init__(self):
        self.message_service = MessageService()
        self.user_repo = UserRepository()
        self.model_name = "gemini-2.5-flash" # Use flash for fast and free usage
        self.model = None

    def get_or_create_ai_user(self):
        # Find user with username 'SyncBot'
        bot = self.user_repo.find_by_username('SyncBot')
        if not bot:
            from app.models.user import User
            from app import db
            # Create the bot user
            bot = User(
                username='SyncBot',
                email='bot@synctalk.local',
                password_hash='not-a-real-password', # AI user cannot login
                profile_image_url='https://api.dicebear.com/7.x/bottts/png?seed=SyncBot',
                is_online=True
            )
            db.session.add(bot)
            db.session.commit()
        return bot

    def generate_response(self, sender_id, receiver_id, history_messages):
        if not self.model:
            from dotenv import load_dotenv
            load_dotenv() # Force reload .env
            api_key = os.environ.get("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(self.model_name)
            else:
                return "Xin lỗi, hệ thống chưa cấu hình GEMINI_API_KEY để tôi có thể hoạt động."

        try:
            # Build conversation history
            prompt = "Bạn là SyncBot, một trợ lý AI hữu ích và thân thiện trên ứng dụng chat SyncTalk. Hãy trả lời ngắn gọn, tự nhiên và bằng tiếng Việt.\n\nNgữ cảnh cuộc trò chuyện gần đây:\n"
            for msg in history_messages:
                author_name = msg.sender.username if msg.sender else "Unknown"
                prompt += f"{author_name}: {msg.content}\n"
            
            prompt += "\nSyncBot:"

            response = self.model.generate_content(prompt)
            return response.text
        except Exception:
            return "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn lúc này."

    def process_ai_mention(self, sender_id, receiver_id, content, socketio, app, is_bot_chat=False):
        """
        Runs the AI generation and sends the message back via sockets.
        Designed to be run in a background thread.

        is_bot_chat=True  → User đang chat trực tiếp với SyncBot (receiver là bot)
                            Bot trả lời lại sender, emit vào room sender_id
        is_bot_chat=False → User @sync trong chat giữa người với người
                            Bot trả lời sender, emit vào cả 2 rooms để cả 2 đều thấy
        """
        with app.app_context():
            from app import db
            try:
                bot = self.get_or_create_ai_user()

                # Emit typing
                socketio.emit('user_typing', {'user_id': bot.id, 'username': bot.username}, room=sender_id)
                if not is_bot_chat:
                    socketio.emit('user_typing', {'user_id': bot.id, 'username': bot.username}, room=receiver_id)

                # Lấy lịch sử hội thoại
                if is_bot_chat:
                    messages, _ = self.message_service.get_conversation(sender_id, bot.id)
                else:
                    messages, _ = self.message_service.get_conversation(sender_id, receiver_id)

                history = list(messages)[-10:] if messages else []
                ai_text = self.generate_response(sender_id, receiver_id, history)

                # Dừng typing
                socketio.emit('user_stop_typing', {'user_id': bot.id, 'username': bot.username}, room=sender_id)
                if not is_bot_chat:
                    socketio.emit('user_stop_typing', {'user_id': bot.id, 'username': bot.username}, room=receiver_id)

                # Lưu message bot → sender
                ai_msg, err = self.message_service.send_message(bot.id, sender_id, ai_text)
                if err:
                    return

                if ai_msg:
                    # Payload cho sender (receiver_id = sender_id)
                    msg_for_sender = {
                        'id': ai_msg.id,
                        'sender_id': ai_msg.sender_id,
                        'receiver_id': sender_id,   # ← đúng với sender
                        'content': ai_msg.content,
                        'image_url': ai_msg.image_url,
                        'is_read': ai_msg.is_read,
                        'created_at': str(ai_msg.created_at)
                    }
                    socketio.emit('new_message', msg_for_sender, room=sender_id)

                    if not is_bot_chat:
                        # Payload cho receiver — receiver_id = receiver_id để frontend filter đúng
                        msg_for_receiver = {**msg_for_sender, 'receiver_id': receiver_id}
                        socketio.emit('new_message', msg_for_receiver, room=receiver_id)

            except Exception:
                pass
            finally:
                db.session.remove()


