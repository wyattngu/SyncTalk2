# frontend/Dockerfile

FROM node:20

WORKDIR /app

# Cài dependencies
COPY package*.json .
RUN npm install

# Copy code
COPY . .

# Build Next.js


EXPOSE 3000

CMD ["npm", "run", "dev"]