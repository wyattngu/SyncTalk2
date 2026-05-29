# backend/Dockerfile

FROM python:3.12-slim

WORKDIR /app

# Cài dependencies trước để cache layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code
COPY . .

# Expose port
EXPOSE 5001

# Chạy với eventlet
CMD ["sh", "start.sh"]