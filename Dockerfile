FROM node:24.18.0-slim AS dist

WORKDIR /app
COPY package.json ./
RUN npm ci
COPY . .
RUN npm run build  # Chạy build với NestJS

FROM node:24.18.0-slim AS node_modules
WORKDIR /app
COPY package.json ./
RUN npm ci

FROM node:24.18.0-slim
ARG PORT=3001
WORKDIR /usr/src/app

COPY . /usr/src/app
COPY --from=dist /app/dist /usr/src/app/dist
COPY --from=node_modules /app/node_modules /usr/src/app/node_modules

EXPOSE $PORT

COPY ./start.sh /usr/src/app/start.sh
RUN chmod +x /usr/src/app/start.sh

CMD ["/usr/src/app/start.sh"]
