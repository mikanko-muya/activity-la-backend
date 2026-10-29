FROM node:22-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The schema goes in before the install, whose postinstall generates the client
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .

EXPOSE 6767

# Apply pending migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
