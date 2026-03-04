# Build frontend
FROM node:20 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:20 AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/
RUN npm install prisma@5.22.0 @prisma/client@5.22.0 --save-exact
RUN npx prisma@5.22.0 generate
COPY backend/src ./src/
RUN npm run build

# Production
FROM node:20
WORKDIR /app
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma/
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ARG DATABASE_URL
RUN echo "DATABASE_URL=${DATABASE_URL}" > .env

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
