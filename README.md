# Activity LA - backend

Express 5 + Prisma 7 API for the Activity LA ticketing platform, served under `/api/v1`.

## First run

Needs Node 22 or newer, and a MySQL 8+ or MariaDB 10.4+ server. A normal install or XAMPP is fine; Docker is optional (see below).

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in the blanks below
npm run setup               # generate the client and apply every migration
npm run seed:dev            # sample data to click around in (local databases only)
npm run dev                 # http://localhost:6767/api/v1
```

In `.env`, at minimum:

- `DATABASE_URL`: your MySQL user, password and port, for example `mysql://root:mypassword@localhost:3306/db_activity_la`. XAMPP's root has no password: `mysql://root@localhost:3306/db_activity_la`.
- `JWT_SECRET` and `JWT_REFRESH_SECRET`: run `npm run secret` once for each. They must differ.
- `SUPERADMIN_*`: only if you run `npm run seed:superadmin`.
- `PHAJAY_SECRET_KEY`: only for real QR payments. Ask the team for it, and never commit it.

`seed:dev` signs you in as:

| Role | Phone | Password |
|---|---|---|
| ADMIN | 0201000001 | Admin1234! |
| Customer | 0202000001 to 0202000008 | Customer123! |

It wipes everything except SUPERADMIN accounts, and refuses to run against a database that is not on your machine.

### The database

With `root`, `npm run setup` creates the database itself. With your own MySQL user, create the empty database first (in Workbench, phpMyAdmin or the `mysql` shell) and give the user rights to it. Otherwise setup fails with `P1010: User was denied access`.

```sql
CREATE DATABASE db_activity_la;
CREATE USER 'activity'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL PRIVILEGES ON `db\_activity\_la%`.* TO 'activity'@'localhost';
```

Whoever writes new migrations (`npm run db:migrate:dev`) also needs the shadow database to exist. Prisma does not create it, and fails with `P1003: Database db_activity_la_shadow does not exist`. The `%` in the grant above already covers it:

```sql
CREATE DATABASE db_activity_la_shadow;
```

To use Docker instead of an installed server, run `docker compose up -d db` and use `mysql://root:root_password@localhost:3309/db_activity_la`.

### When the database will not connect

Run `npm run db:check` (`npm run setup` runs it first anyway). It says what is wrong without printing your password:

| Error | Usually means |
|---|---|
| `P1000: Authentication failed` | The user or password is wrong for the server on that port. Log in with the same ones in Workbench or phpMyAdmin. XAMPP's root has no password. With both XAMPP and MySQL installed, the one on port 3306 may not be the one you think. |
| `P1001: Can't reach database server` | MySQL is not running, or not on that port. Or an unescaped `@` in the password. |
| `P1013: The provided database string is invalid` | The password has `@ # : / ?` in it. Write them as `%40 %23 %3A %2F %3F`. |
| `P1010: User was denied access` | Your user cannot create the database. Create it first (see above). |
| Editing `.env` changes nothing | `DATABASE_URL` is also set in Windows environment variables, and that one wins. `db:check` tells you when this is the case. |

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
| `npm run setup` | `db:check`, then `db:generate`, then `db:migrate` |
| `npm run db:check` | Says whether `DATABASE_URL` works, and what is wrong if not |
| `npm run db:generate` | Regenerates the Prisma client after a schema change |
| `npm run db:migrate` | Applies migrations that have not run yet |
| `npm run db:migrate:dev` | Creates a new migration from schema changes |
| `npm run seed:dev` | Resets the database to sample data |
| `npm run seed:superadmin` | Creates the first SUPERADMIN from `SUPERADMIN_*` in `.env` |
| `npm run secret` | Prints a random 64-character secret |

## Testing payments

`postman/generate-qr.postman_collection.json` generates a 1-kip PhaJay QR you can scan and pay. It needs the seed data and `PHAJAY_SECRET_KEY` in `.env`. The description inside the collection explains each folder.
