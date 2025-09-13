# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20-slim AS build-stage
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY package*.json /app/
COPY pnpm-lock.yaml /app/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY ./ /app/

ARG VITE_API_URL=${VITE_API_URL}
ARG VITE_USE_DEVTOOLS=${VITE_USE_DEVTOOLS}

RUN pnpm run build


# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1

COPY --from=build-stage /app/dist/ /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
