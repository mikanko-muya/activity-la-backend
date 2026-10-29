# Activity LA - backend

Express 5 + Prisma 7 API for the Activity LA ticketing platform, served under `/api/v1`.

## First run

Needs Node 22 or newer and Docker.

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in the blanks below
docker compose up -d db     # MariaDB on localhost:3309
npm run setup               # generate the client and apply every migration
npm run seed:dev            # sample data to click around in (local databases only)
npm run dev                 # http://localhost:6767/api/v1
```

In `.env`, at minimum:

- `JWT_SECRET` and `JWT_REFRESH_SECRET`: run `npm run secret` once for each. They must differ.
- `DATABASE_URL`: the example already matches `docker compose up -d db`.
- `SUPERADMIN_*`: only if you run `npm run seed:superadmin`.
- `PHAJAY_SECRET_KEY`: only for real QR payments. Ask the team for it, and never commit it.

`seed:dev` signs you in as:

| Role | Phone | Password |
|---|---|---|
| ADMIN | 0201000001 | Admin1234! |
| Customer | 0202000001 to 0202000008 | Customer123! |

It wipes everything except SUPERADMIN accounts, and refuses to run against a database that is not on your machine.

## After pulling

```bash
npm install
npm run setup
```

If `npm run setup` says the database has drifted or needs a reset, your local data predates a rewritten migration. `npx prisma migrate reset` rebuilds it from scratch (it deletes your local data), then `npm run seed:dev` puts sample data back.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` / `npm start` | Runs the API and restarts it on changes |
| `npm run setup` | `db:generate` then `db:migrate` |
| `npm run db:generate` | Regenerates the Prisma client after a schema change |
| `npm run db:migrate` | Applies migrations that have not run yet |
| `npm run db:migrate:dev` | Creates a new migration from schema changes |
| `npm run seed:dev` | Resets the database to sample data |
| `npm run seed:superadmin` | Creates the first SUPERADMIN from `SUPERADMIN_*` in `.env` |
| `npm run secret` | Prints a random 64-character secret |

## Testing payments

`postman/generate-qr.postman_collection.json` generates a 1-kip PhaJay QR you can scan and pay. It needs the seed data and `PHAJAY_SECRET_KEY` in `.env`. The description inside the collection explains each folder.
