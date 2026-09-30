import "dotenv/config";
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // Lets `prisma migrate diff --from-migrations` replay the whole migration
    // directory into a throwaway database and compare the result against the
    // schema. That check is what catches a migration that cannot reproduce the
    // schema from scratch - the failure a developer only sees when they clone.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});