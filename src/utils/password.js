import bcript from "bcryptjs";

export const hashPassword = async (password) => {
    return bcript.hash(password, 12);
};

export const comparePassword = async (password, hashedPassword) => {
    return bcript.compare(password, hashedPassword);
};