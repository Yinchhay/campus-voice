FROM node:22.11-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# --- dev ---
FROM base AS dev
CMD ["npm", "run", "dev"]

# --- prod ---
FROM base AS prod
RUN npm run build
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]