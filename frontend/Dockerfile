FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY . .
RUN npm run build
CMD ["npm","run","dev","--","--host"]
