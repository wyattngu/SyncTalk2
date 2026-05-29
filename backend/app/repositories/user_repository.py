# backend/app/repositories/user_repository.py

from app import db
from app.models.user import User

class UserRepository:

    def create(self, username, email, password_hash):
        user = User(
            username=username,
            email=email,
            password_hash=password_hash
        )
        db.session.add(user)
        db.session.commit()
        return user

    def find_by_id(self, user_id):
        return User.query.filter_by(id=user_id).first()

    def find_by_email(self, email):
        return User.query.filter_by(email=email).first()

    def find_by_username(self, username):
        return User.query.filter_by(username=username).first()

    def find_by_username_ci(self, username):
        """Case-insensitive lookup, useful for @mentions."""
        if not username:
            return None
        return User.query.filter(User.username.ilike(username)).first()

    def get_all(self):
        return User.query.all()

    def update_online_status(self, user_id, is_online):
        user = self.find_by_id(user_id)
        if user:
            user.is_online = is_online
            db.session.commit()
        return user

    def update_profile(self, user_id, data):
        user = self.find_by_id(user_id)
        if user:
            if 'username' in data:
                user.username = data['username']
            if 'profile_image_url' in data:
                user.profile_image_url = data['profile_image_url']
            db.session.commit()
        return user

    def delete(self, user_id):
        user = self.find_by_id(user_id)
        if user:
            db.session.delete(user)
            db.session.commit()
        return user