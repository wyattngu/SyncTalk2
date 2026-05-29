# backend/app/utils/ai_helper.py

import os
import time
import logging
import sys
from google.api_core import exceptions
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [AI-%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ai_helper")

# SDK DETECTION
SDK_TYPE = "old"
try:
    import google.generativeai as genai
    SDK_TYPE = "old"
    logger.info("Detected SDK: google.generativeai")
except ImportError:
    try:
        from google import genai as genai_new
        SDK_TYPE = "new"
        logger.info("Detected SDK: google.genai")
    except ImportError:
        SDK_TYPE = None

# Based on user's working screenshot in 2026, Gemini 3 Flash Preview is the working model
GEMINI_MODEL = "gemini-3-flash-preview"
MAX_RETRIES = 3
BACKOFF_DELAYS = [2, 5, 10]

def get_client_or_model(model_name):
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key: return None
    try:
        if SDK_TYPE == "new":
            from google import genai as genai_new
            return genai_new.Client(api_key=api_key)
        elif SDK_TYPE == "old":
            genai.configure(api_key=api_key)
            return genai.GenerativeModel(model_name)
    except Exception as e:
        logger.error(f"Init error: {e}")
        return None
    return None

def generate_with_retry(prompt, history=None, generation_config=None):
    current_model = GEMINI_MODEL
    
    last_error_msg = "Lỗi AI không xác định."
    
    for attempt in range(MAX_RETRIES + 1):
        try:
            if attempt > 0:
                time.sleep(BACKOFF_DELAYS[attempt - 1])

            obj = get_client_or_model(current_model)
            if not obj: return None, "Thiếu API Key."

            if SDK_TYPE == "new":
                response = obj.models.generate_content(model=current_model, contents=prompt)
            else:
                if history:
                    chat = obj.start_chat(history=history)
                    response = chat.send_message(prompt, generation_config=generation_config)
                else:
                    response = obj.generate_content(prompt, generation_config=generation_config)
            
            if response and response.text:
                return response.text.strip(), None
            
            last_error_msg = "AI không phản hồi."

        except exceptions.ResourceExhausted as e:
            err_msg = str(e).lower()
            logger.error(f"Quota hit: {e}")
            if "quota" in err_msg or "daily" in err_msg:
                # If Gemini 3 fails, try 2.0 as fallback
                if current_model == "gemini-3-flash-preview":
                    logger.warning("Quota hit for Gemini 3, trying Gemini 2.0...")
                    current_model = "gemini-2.0-flash"
                    continue
                return None, "Bạn đã dùng hết hạn mức AI trong ngày."
            
            last_error_msg = "Vui lòng đợi vài giây."
            continue

        except exceptions.NotFound as e:
            logger.error(f"Model not found: {e}")
            if current_model == "gemini-3-flash-preview":
                current_model = "gemini-2.0-flash"
                continue
            return None, "Model AI không khả dụng."

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            last_error_msg = f"Lỗi: {str(e)}"
            continue

    return None, last_error_msg

_user_last_request = {}
def throttle_user(user_id):
    if not user_id: return True, None
    now = time.time()
    last_time = _user_last_request.get(user_id, 0)
    if now - last_time < 2:
        return False, "Vui lòng nhắn chậm lại một chút."
    _user_last_request[user_id] = now
    return True, None
