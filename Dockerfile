FROM node:22-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 6767

# Apply pending migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
