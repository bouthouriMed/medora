FROM node:20 AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/
RUN npm install prisma@5.22.0 @prisma/client@5.22.0 --save-exact
RUN npx prisma@5.22.0 generate
COPY backend/src ./src/
RUN npm run build

FROM node:20
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_URL=postgresql://postgres:gSbFckOnpxcoqfzClxctegjxfWqdMAnG@postgres.railway.internal:5432/railway

EXPOSE 8080

CMD ["node", "dist/index.js"]
