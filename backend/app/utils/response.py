# backend/app/utils/response.py

from flask import jsonify

def success_response(data=None, message='Success', status_code=200):
    response = {
        'success': True,
        'message': message,
        'data': data
    }
    return jsonify(response), status_code

def error_response(message='Error', status_code=400):
    response = {
        'success': False,
        'message': message,
        'data': None
    }
    return jsonify(response), status_code