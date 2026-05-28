# Build client + server deps
FROM node:20-alpine AS build

WORKDIR /app

# --- Server deps ---
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

# --- Client deps + build ---
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

COPY client ./client
RUN cd client && npm run build

# --- Copy server source last ---
COPY server ./server


# Runtime image
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

# Copy server runtime (including node_modules from build stage)
COPY --from=build /app/server /app/server

# Copy built client assets
COPY --from=build /app/client/dist /app/client/dist

EXPOSE 8080

CMD ["node", "server/src/index.js"]
