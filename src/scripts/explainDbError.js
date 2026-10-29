// The MariaDB adapter reports an unreachable server, a wrong password and a
// missing database all as a pool timeout, which says nothing about the fix.
export const explainDbError = (error) => {
    if (/pool timeout|ECONNREFUSED|Access denied|Unknown database/i.test(error.message)) {
        return (
            `${error.message}\n\n` +
            "Could not use the database. Check that:\n" +
            "  - MySQL is running:            docker compose up -d db\n" +
            "  - DATABASE_URL in .env is right (see .env.example)\n" +
            "  - the tables exist:            npm run setup"
        );
    }
    if (/does not exist in the current database|Table .* doesn't exist/i.test(error.message)) {
        return `${error.message}\n\nThe tables are missing or out of date - run: npm run setup`;
    }
    return error.message;
};
