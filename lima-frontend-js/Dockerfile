FROM node:18-bookworm-slim

ENV NODE_ENV=development

WORKDIR /app

# Install dependencies first so edits to src/ do not invalidate this layer.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# react-app-rewired start (see package.json scripts)
CMD ["npm", "start"]
