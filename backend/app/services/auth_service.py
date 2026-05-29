# backend/app/services/auth_service.py

import jwt
import os
from datetime import datetime, timezone, timedelta


from app import bcrypt
from app.repositories.user_repository import UserRepository

user_repo = UserRepository()

class AuthService:

    def register(self, username, email, password):
        if user_repo.find_by_email(email):
            return None, 'Email already exists'

        if user_repo.find_by_username(username):
            return None, 'Username already exists'

        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        user = user_repo.create(username, email, password_hash)
        return user, None

    def login(self, email, password):
        user = user_repo.find_by_email(email)
        if not user:
            return None, None, 'Email not found'

        if not bcrypt.check_password_hash(user.password_hash, password):
            return None, None, 'Incorrect password'

        user.last_seen = datetime.now(timezone.utc)
        from app import db
        db.session.commit()

        token = self._generate_token(user.id)
        return user, token, None

    def _generate_token(self, user_id):
        payload = {
            'user_id': user_id,
            'exp': datetime.now(timezone.utc) + timedelta(
                seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
            )
        }
        token = jwt.encode(payload, os.getenv('JWT_SECRET_KEY'), algorithm='HS256')
        return token

    def verify_token(self, token):
        try:
            payload = jwt.decode(token, os.getenv('JWT_SECRET_KEY'), algorithms=['HS256'])
            user = user_repo.find_by_id(payload['user_id'])
            if not user:
                return None, 'User not found'
            return user, None
        except jwt.ExpiredSignatureError:
            return None, 'Token expired'
        except jwt.InvalidTokenError:
            return None, 'Invalid token'

    def get_profile(self, user_id):
        user = user_repo.find_by_id(user_id)
        if not user:
            return None, 'User not found'
        return user, None

    def update_profile(self, user_id, data):
        user = user_repo.update_profile(user_id, data)
        if not user:
            return None, 'User not found'
        return user, None