# Build context is the repo root (see docker-compose.yml).
FROM node:22-slim

WORKDIR /app

# Install workspace deps. Copy manifests first for better layer caching.
COPY package.json package-lock.json* ./
COPY packages/db/package.json packages/db/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN npm install

# Copy source for the db package and the worker.
COPY packages/db packages/db
COPY apps/worker apps/worker

WORKDIR /app/apps/worker
CMD ["npm", "run", "start"]
