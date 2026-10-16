import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const PORT = process.env.PORT
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET
const PHAJAY_SECRET_KEY = process.env.PHAJAY_SECRET_KEY


export {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    PORT,
    PAYMENT_WEBHOOK_SECRET,
    PHAJAY_SECRET_KEY,
}
