# Build context is the repo root (see docker-compose.yml).
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/db/package.json packages/db/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/db packages/db
COPY apps/web apps/web
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
# AUTH_SECRET is needed at build init; a dummy is fine since pages are dynamic.
ENV AUTH_SECRET=build-time-placeholder
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/db ./packages/db
COPY --from=build /app/apps/web ./apps/web
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]
