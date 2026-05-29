# backend/app/controllers/upload_controller.py

import os
import uuid
from flask import Blueprint, request, current_app
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response

upload_bp = Blueprint('upload', __name__, url_prefix='/api/upload')


def _upload_to_cloudinary(file):
    """Upload file lên Cloudinary và trả về URL."""
    import cloudinary
    import cloudinary.uploader

    cloud_name = current_app.config.get('CLOUDINARY_CLOUD_NAME')
    api_key = current_app.config.get('CLOUDINARY_API_KEY')
    api_secret = current_app.config.get('CLOUDINARY_API_SECRET')

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
    )

    result = cloudinary.uploader.upload(
        file,
        folder='synctalk',
        resource_type='image',
    )
    return result.get('secure_url')


def _save_local(file):
    """Lưu file vào thư mục static/uploads (fallback khi chưa có Cloudinary)."""
    upload_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] or '.jpg'
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    # Trả về URL tương đối — frontend sẽ prepend base URL
    base_url = os.getenv('API_BASE_URL', 'http://localhost:5001')
    return f"{base_url}/static/uploads/{filename}"


@upload_bp.route('/image-upload', methods=['POST'])
@token_required
def image_upload(current_user):
    if 'file' not in request.files:
        return error_response('No file provided', 400)

    file = request.files['file']
    if file.filename == '':
        return error_response('No file selected', 400)

    # Kiểm tra loại file
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed_extensions:
        return error_response('File type not allowed', 400)

    # Kiểm tra kích thước (max 10MB)
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 10 * 1024 * 1024:
        return error_response('File too large (max 10MB)', 400)

    try:
        cloud_name = current_app.config.get('CLOUDINARY_CLOUD_NAME', '')
        # Dùng Cloudinary nếu đã cấu hình, ngược lại lưu local
        if cloud_name and cloud_name not in ('your_cloud_name', '', None):
            url = _upload_to_cloudinary(file)
        else:
            url = _save_local(file)

        return success_response(data={'url': url}, message='Image uploaded successfully', status_code=201)

    except Exception as e:
        current_app.logger.error(f'Image upload error: {e}')
        return error_response('Upload failed', 500)
