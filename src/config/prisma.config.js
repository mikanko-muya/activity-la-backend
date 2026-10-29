import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// MySQL 8's default login needs the server's public key for a user it has not
// seen since it started, and without it the pool just times out. Fetching the
// key is safe on this machine; a remote server should use TLS instead.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]", "db"];

const withLocalKeyRetrieval = (raw) => {
  const url = new URL(raw);
  if (LOCAL_HOSTS.includes(url.hostname) && !url.searchParams.has("allowPublicKeyRetrieval")) {
    url.searchParams.set("allowPublicKeyRetrieval", "true");
  }
  return url.toString();
};

const adapter = new PrismaMariaDb(withLocalKeyRetrieval(DATABASE_URL));

export const prisma = new PrismaClient({ adapter });