import { existsSync, readFileSync } from "node:fs";

import dotenv from "dotenv";
import mariadb from "mariadb";

// Read before dotenv runs: dotenv never replaces a variable that is already
// set, so one set in Windows or the shell silently wins over .env.
const fromSystem = process.env.DATABASE_URL;
const fromFile = existsSync(".env") ? dotenv.parse(readFileSync(".env")).DATABASE_URL : undefined;
const raw = fromSystem ?? fromFile;

const ok = (msg) => console.log(`  ok    ${msg}`);
const warn = (msg) => console.log(`  !!    ${msg}`);
const fail = (msg) => {
    console.log(`  FAIL  ${msg}`);
    process.exit(1);
};

console.log("Checking DATABASE_URL\n");

if (!existsSync(".env")) warn("there is no .env here - copy .env.example to .env");

if (!raw) fail("DATABASE_URL is not set - put it in .env (see .env.example)");

if (fromSystem) {
    warn("DATABASE_URL is also set outside .env (Windows environment variables or the shell).");
    warn("That one wins, so editing .env changes nothing.");
    if (fromFile && fromFile !== fromSystem) {
        warn("It differs from the one in .env. Remove it from Windows environment variables,");
        warn("or run in PowerShell: Remove-Item Env:DATABASE_URL, then reopen the terminal.");
    }
}

// Characters that end the password part of a URL unless written as %XX.
const credentials = raw.slice(raw.indexOf("://") + 3, raw.lastIndexOf("@"));
const rawPassword = credentials.includes(":") ? credentials.slice(credentials.indexOf(":") + 1) : "";
const unsafe = [...new Set(rawPassword.match(/[@#:/?]/g) ?? [])];
if (unsafe.length > 0) {
    const codes = { "@": "%40", "#": "%23", ":": "%3A", "/": "%2F", "?": "%3F" };
    fail(
        `the password contains ${unsafe.join(" ")} - in the URL write ` +
        unsafe.map((c) => `${c} as ${codes[c]}`).join(", ")
    );
}

let url;
try {
    url = new URL(raw);
} catch {
    fail("DATABASE_URL is not a valid URL - expected mysql://user:password@localhost:3306/db_activity_la");
}

const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const host = url.hostname;
const port = Number(url.port || 3306);
const database = url.pathname.slice(1);

if (url.protocol !== "mysql:") fail(`it starts with ${url.protocol}// - it must start with mysql://`);
if (!user) fail("no user - expected mysql://user:password@host:port/database");
if (!database) fail("no database name at the end - add /db_activity_la");
if (/your_password/i.test(password)) fail("the password is still the YOUR_PASSWORD placeholder from .env.example");

ok(`user ${user}, password ${password ? `set (${password.length} characters)` : "empty"}`);
ok(`server ${host}:${port}, database ${database}`);

let conn;
try {
    // Same as the app (src/config/prisma.config.js), so a pass here means the app connects too.
    conn = await mariadb.createConnection({
        host,
        port,
        user,
        password,
        connectTimeout: 5000,
        allowPublicKeyRetrieval: ["localhost", "127.0.0.1", "::1", "[::1]", "db"].includes(host),
    });
} catch (error) {
    if (error.errno === 1045) {
        fail(
            `the server at ${host}:${port} refused user "${user}" with this password (P1000).\n` +
            "        - Log in with the same user and password in Workbench, phpMyAdmin or `mysql -u " + user + " -p`.\n" +
            "        - XAMPP's root usually has no password: mysql://root@localhost:3306/db_activity_la\n" +
            "        - If both XAMPP and MySQL are installed, only one owns port " + port + " - it may not be the one\n" +
            "          whose password you know. Stop one of them, or give one a different port."
        );
    }
    if (error.code === "ECONNREFUSED" || error.code === "ER_CONNECTION_TIMEOUT" || /timeout/i.test(error.message)) {
        fail(`nothing answered at ${host}:${port} - is MySQL running, and on that port?`);
    }
    fail(`could not connect: ${error.message}`);
}

const [{ version }] = await conn.query("SELECT VERSION() AS version");
ok(`logged in - ${/mariadb/i.test(version) ? "MariaDB" : "MySQL"} ${version}`);

const exists = (await conn.query("SHOW DATABASES LIKE ?", [database])).length > 0;
if (exists) {
    const [{ tables }] = await conn.query(
        "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema = ?",
        [database]
    );
    ok(`database ${database} exists with ${tables} tables${Number(tables) === 0 ? " - run npm run setup" : ""}`);
} else if (user === "root") {
    ok(`database ${database} does not exist yet - npm run setup will create it`);
} else {
    warn(`database ${database} does not exist, and npm run setup cannot create it as "${user}".`);
    warn(`create it first: CREATE DATABASE ${database};  (see README, "The database")`);
}

await conn.end();
console.log("\nThe connection works.");
