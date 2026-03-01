# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/
RUN npx prisma generate
COPY backend/src ./src/
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY backend/prisma ./prisma/

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
