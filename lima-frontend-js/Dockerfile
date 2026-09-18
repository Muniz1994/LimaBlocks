FROM node:18-bookworm-slim

ENV NODE_ENV=development

WORKDIR /app

# Install dependencies first so edits to src/ do not invalidate this layer.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Documentation only; the port actually served is PORT (FRONTEND_PORT in .env).
EXPOSE 3000

# react-app-rewired start (see package.json scripts); it reads PORT and the
# REACT_APP_* variables from the environment at startup.
CMD ["npm", "start"]
