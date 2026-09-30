import dotenv from "dotenv";
import { prisma } from "../config/prisma.config.js";
import { userRepository } from "../module/user/user.repository.js";
import { hashPassword } from "../utils/password.js";

dotenv.config();

const { SUPERADMIN_NAME, SUPERADMIN_EMAIL, SUPERADMIN_PHONE, SUPERADMIN_PASSWORD } = process.env;
// missing is an array of the env vars that are undefined or empty. If any are missing, the script exits with an error.
const missing = Object.entries({ SUPERADMIN_EMAIL, SUPERADMIN_PHONE, SUPERADMIN_PASSWORD })
    .filter(([, value]) => !value)
    .map(([key]) => key);
//check if the required env vars are present and valid
if (missing.length > 0) {
    console.error(`Missing required env var(s): ${missing.join(", ")}`);
    console.error("Add them to .env - see .env.example for the shape.");
    process.exit(1);
}
// check if the password is at least 8 characters long
if (SUPERADMIN_PASSWORD.length < 8) {
    console.error("SUPERADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
}
// check if the email and phone are valid formats
const main = async () => {
    const existing =
        (await userRepository.findByEmail(SUPERADMIN_EMAIL)) ??
        (await userRepository.findByPhone(SUPERADMIN_PHONE));
//duplicate check
    if (existing) {
        if (existing.role === "SUPERADMIN") {
            console.log(`Superadmin already exists: ${existing.email} (${existing.id})`);
            return;
        }
// promote the existing account to SUPERADMIN
        const promoted = await userRepository.update(existing.id, {
            role: "SUPERADMIN",
            isActive: true,
        });
        console.log(`Promoted existing account to SUPERADMIN: ${promoted.email} (${promoted.id})`);
        return;
    }
// create a new superadmin
    const created = await userRepository.create({
        name: SUPERADMIN_NAME || "Super Admin",
        email: SUPERADMIN_EMAIL,
        phone: SUPERADMIN_PHONE,
        password: await hashPassword(SUPERADMIN_PASSWORD),
        role: "SUPERADMIN",
    });

    console.log(`Created SUPERADMIN: ${created.email} (${created.id})`);
};
// run the main function and handle the error if it fails
main()
    .catch((error) => {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    })
//
    .finally(async () => {
        await prisma.$disconnect();
    });
