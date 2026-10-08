import { randomBytes, randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";

const TICKET_CODE_LENGTH = 10;

export const generateTicketCode = () => {
    let code = "";
    for (let i = 0; i < TICKET_CODE_LENGTH; i += 1) {
        code += ALPHABET[randomInt(0, ALPHABET.length)];
    }
    return `TKT-${code}`;
};

export const generateQrPayload = () => randomBytes(24).toString("base64url");

export const generateTransactionRef = () => `ALA-${randomBytes(12).toString("hex").toUpperCase()}`;
