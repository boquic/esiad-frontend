# Dockerfile — esiad-frontend (Angular v21)
# La app usa rutas relativas /api, así que detrás del reverse proxy (nginx)
# queda en el mismo origen que el backend -> sin CORS, sin URL horneada.
# La config de nginx la monta deploy/docker-compose.yml (deploy/nginx.conf).

############################
# Stage 1: build de Angular
############################
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# build = "ng build"; defaultConfiguration es production en angular.json.
RUN npm run build

############################
# Stage 2: nginx sirve el estático
############################
FROM nginx:1.27-alpine AS runtime

# @angular/build:application genera en dist/<proyecto>/browser.
COPY --from=builder /app/dist/esiad-frontend/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
