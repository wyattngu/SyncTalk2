"""Free-text → structured query → ranked threads."""

import os
import json

import google.generativeai as genai
from dotenv import load_dotenv

from app import db
from app.models.thread import Thread
from app.models.tag import Tag, ThreadTag

EXTRACT_PROMPT = """Extract a structured search query from the user's natural language request.

User request: "{q}"

Respond ONLY with a JSON object with these keys:
- keywords: array of 1-5 important keywords/phrases (no stopwords)
- tag_slugs: array of tag slugs that apply, picked ONLY from this list: {tag_slugs}
  (return [] if nothing matches)
- intent: one of "find_thread", "find_user", "general"

Do not include any other keys, code fences, or prose.
"""


class SemanticSearchService:

    def __init__(self):
        self._model = None
        self._configured = False

    def _ensure_model(self):
        if self._configured:
            return self._model
        load_dotenv()
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel('gemini-2.5-flash')
        self._configured = True
        return self._model

    def _extract_filters(self, query):
        """Returns ({keywords, tag_slugs, intent}, used_ai: bool)."""
        model = self._ensure_model()
        all_tags = [t.slug for t in Tag.query.all()]

        if not model:
            # Fallback: naive keyword split
            return {
                'keywords': [w for w in query.lower().split() if len(w) > 2][:5],
                'tag_slugs': [],
                'intent': 'find_thread',
            }, False

        prompt = EXTRACT_PROMPT.format(
            q=query.replace('"', '\\"'),
            tag_slugs=json.dumps(all_tags),
        )
        try:
            resp = model.generate_content(
                prompt,
                generation_config={'response_mime_type': 'application/json'},
            )
            payload = json.loads((resp.text or '').strip())
            return {
                'keywords': [str(k) for k in (payload.get('keywords') or [])][:5],
                'tag_slugs': [
                    s for s in (payload.get('tag_slugs') or []) if s in all_tags
                ],
                'intent': payload.get('intent', 'find_thread'),
            }, True
        except Exception:
            return {
                'keywords': [w for w in query.lower().split() if len(w) > 2][:5],
                'tag_slugs': [],
                'intent': 'find_thread',
            }, False

    def _rank_threads(self, filters):
        keywords = filters.get('keywords') or []
        tag_slugs = filters.get('tag_slugs') or []

        q = Thread.query

        if tag_slugs:
            tag_ids = [t.id for t in Tag.query.filter(Tag.slug.in_(tag_slugs)).all()]
            if tag_ids:
                q = q.join(ThreadTag, ThreadTag.thread_id == Thread.id).filter(
                    ThreadTag.tag_id.in_(tag_ids)
                )

        if keywords:
            from sqlalchemy import or_
            conds = []
            for k in keywords:
                pattern = f'%{k}%'
                conds.append(Thread.title.ilike(pattern))
                conds.append(Thread.content.ilike(pattern))
            q = q.filter(or_(*conds))

        rows = q.distinct().order_by(Thread.created_at.desc()).limit(30).all()

        # Simple ranking: keyword hit count + recency boost (newer = higher)
        def score(t):
            text = f"{t.title} {t.content}".lower()
            kw = sum(text.count(k.lower()) for k in keywords) if keywords else 1
            return kw

        rows.sort(key=score, reverse=True)
        return rows[:20]

    def search(self, query):
        if not query or not query.strip():
            return None, 'Query is required'
        filters, used_ai = self._extract_filters(query.strip())
        threads = self._rank_threads(filters)
        return {
            'query': query,
            'filters': filters,
            'used_ai': used_ai,
            'threads': [
                {
                    'id': t.id,
                    'title': t.title,
                    'content': t.content,
                    'author_id': t.author_id,
                    'reply_count': t.reply_count,
                    'like_count': t.like_count,
                    'is_pinned': t.is_pinned,
                    'image_url': t.image_url,
                    'created_at': str(t.created_at),
                }
                for t in threads
            ],
        }, None
