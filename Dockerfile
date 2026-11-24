# The whole site with its API (/api) and the client app, on one Node server.
# Build: docker build -t fs-studio .   Run: docker run -p 4321:4321 -e DATABASE_URL=... -e ADMIN_EMAILS=... fs-studio
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
USER node
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:4321/api/health/ || exit 1
CMD ["node", "dist/server/entry.mjs"]
