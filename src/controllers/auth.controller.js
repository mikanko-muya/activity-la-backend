import { SendCreate, SendError, SendSuccess } from "../utils/response.js";
import { validateData } from "../services/validate.js";
import { prisma } from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

// @ts-ignore
const safeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
}
export default class AuthControllers {
  // @ts-ignore
  static async register(req, res) {
    try {
      const { name, email, phone, password } = req.body;

      const validate = await validateData({ name, email, phone, password });
      if (validate.length > 0) return SendError(res, 400, `Bad request`, `${validate.join(', ')} are required`);

      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) return SendError(res, 409, `Email already registed`);

      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) return SendError(res, 409, `Phone number already registed`);

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: passwordHash,
        },

      });
      return SendCreate(res, 'Registration successful', safeUser(user));
    } catch (error) {
      console.log(error);
      return SendError(res, 500, `Server Internal`, error);
    }
  }

  // @ts-ignore
  static async login(req, res) {
    try {
      const { identifier, password } = req.body;
      if (!identifier) return SendError(res, 400, 'Bad request', 'Email or phone is required');

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ],
        },
      });
      if (!user) return SendError(res, 401, 'Bad request', 'Invalid email , phone or password');

      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) return SendError(res, 401, 'Bad request', 'Invalid email , phone or password');

      const accessToken = generateAccessToken({ id: user.id })
      const refreshToken = generateRefreshToken({ id: user.id })

      const data = {
        ...safeUser(user),
        accessToken,
        refreshToken
      }

      return SendSuccess(res, 'Login successful', data);
    } catch (error) {
      console.log(error);
      return SendError(res, 500, "Sever Internal", error);
    }
  }

  // @ts-ignore
  static async forgotPassword(req, res) {
    try {
      const { email, newPassword } = req.body;

      const validate = await validateData({ email, newPassword })
      if (validate.length > 0) return SendError(res, 400, 'Bad request',`${validate.join(', ')} are required`)

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return SendError(res, 401, 'Bad request', `Invalid email`)

      const passwordHash = await hashPassword(newPassword)

      const data = await prisma.user.update({
        where: { email },
        data: { password: passwordHash },
      })

      return SendSuccess(res, 'Password changed successfully', safeUser(data))
    } catch (error) {
      return SendError(res, 500, "Sever Internal", error);
    }
  }
}
