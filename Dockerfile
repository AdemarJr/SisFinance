# SisFinance frontend (Vite SPA) — EasyPanel / Docker
# Build-time: VITE_API_URL deve apontar para a API (ex.: https://api.seudominio.com/api)

# ---- build ----
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts postcss.config.mjs ./
COPY public ./public
COPY src ./src

# Obrigatório em produção EasyPanel (env do serviço vira build-arg)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN test -n "$VITE_API_URL" || (echo "ERROR: VITE_API_URL build-arg is required" && exit 1)
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
