"""Thread summarization powered by Gemini structured output."""

import os
import json
from datetime import datetime, timezone

import google.generativeai as genai
from dotenv import load_dotenv

from app import db
from app.repositories.thread_repository import ThreadRepository
from app.repositories.reply_repository import ReplyRepository

from app.utils.ai_helper import generate_with_retry

thread_repo = ThreadRepository()
reply_repo = ReplyRepository()

SUMMARY_PROMPT = """You are an expert technical editor.
Read the discussion thread below and produce a JSON object with EXACTLY these keys:
- summary: a 2-3 sentence neutral summary of the conversation (string)
- key_points: 3 to 5 bullet points capturing the most important takeaways (array of short strings, no leading dash)
- sentiment: one of "positive", "neutral", "mixed", "negative"

Do NOT include code fences, prose, or any keys other than the three above.
Respond ONLY with valid JSON.

Thread:
{thread_text}
"""


class SummarizationService:

    def _build_thread_text(self, thread, replies):
        author_name = thread.author.username if thread.author else 'Unknown'
        lines = [f"# {thread.title}", f"By @{author_name}", "", thread.content, ""]
        if replies:
            lines.append("## Replies")
            for r in replies:
                rauthor = r.author.username if r.author else 'Unknown'
                lines.append(f"- @{rauthor}: {r.content}")
        return "\n".join(lines)

    def _is_cache_fresh(self, thread):
        return (
            thread.summary
            and thread.summary_reply_count is not None
            and thread.summary_reply_count == (thread.reply_count or 0)
        )

    def get_or_generate(self, thread_id, force=False):
        thread = thread_repo.find_by_id(thread_id)
        if not thread:
            return None, 'Thread not found'

        if not force and self._is_cache_fresh(thread):
            return self._serialize(thread), None

        replies = reply_repo.get_by_thread(thread_id) or []
        thread_text = self._build_thread_text(thread, replies)

        # Use the central retry-enabled generator
        raw, err = generate_with_retry(
            SUMMARY_PROMPT.format(thread_text=thread_text),
            generation_config={'response_mime_type': 'application/json'}
        )
        
        if err:
            return None, err

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as je:
            return None, f'AI response was not valid JSON: {je}'

        thread.summary = payload.get('summary', '').strip()
        key_points = payload.get('key_points') or []
        if not isinstance(key_points, list):
            key_points = [str(key_points)]
        thread.summary_key_points = json.dumps(
            [str(p).strip() for p in key_points if str(p).strip()]
        )
        sentiment = (payload.get('sentiment') or 'neutral').strip().lower()
        if sentiment not in {'positive', 'neutral', 'mixed', 'negative'}:
            sentiment = 'neutral'
        thread.summary_sentiment = sentiment
        thread.summary_reply_count = thread.reply_count or 0
        thread.summary_generated_at = datetime.now(timezone.utc)

        db.session.commit()
        return self._serialize(thread), None

    def _serialize(self, thread):
        return {
            'thread_id': thread.id,
            'summary': thread.summary,
            'key_points': json.loads(thread.summary_key_points) if thread.summary_key_points else [],
            'sentiment': thread.summary_sentiment,
            'reply_count_at_generation': thread.summary_reply_count,
            'generated_at': str(thread.summary_generated_at) if thread.summary_generated_at else None,
            'is_stale': not self._is_cache_fresh(thread),
        }
