import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const PORT = process.env.PORT


export { 
    JWT_SECRET, 
    JWT_REFRESH_SECRET, 
    PORT, 
}