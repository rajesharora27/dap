FROM node:22-bullseye AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Install system deps then upgrade npm to desired major before installing project deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates libssl-dev \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@11.5.2 \
    && npm ci

FROM deps AS build
COPY . .
# Generate Prisma client & build TypeScript
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-1.1.x
RUN npx prisma generate && npm run build \
    && node -e "require('./dist/server.js'); console.log('Build verification ok')"

FROM node:22-bullseye AS runtime
WORKDIR /app
ENV NODE_ENV=production
## copy node_modules AFTER generate (from build stage) so correct engine binary is included
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY package.json ./
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh
CMD ["sh","/app/entrypoint.sh"]
