import { SendCreate, SendError, SendSuccess } from "../services/respon.js";
import { validateData } from "../services/validate.js";
import { prisma } from "../config/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
} from "../config/globalkey.js";

export default class AuthControllers {
  static async register(req, res) {
    try {
      const { name, email, phone, password } = req.body;

      const validate = await validateData({ name, email, phone, password });
      if (validate.length > 0) return SendError(res, 400, `Bad request`, validate.join(','));
      const checkEmail = await prisma.user.findUnique({ where: { email } });
      if (checkEmail) return SendError(res, 409, `This email already registed`);

      const passwordHash = await bcrypt.hash(password, 10);

      const data = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: passwordHash,
        },
        select: { name: true, email: true, phone: true, profileUrl: true }
      });
      return SendCreate(res, 'Register Success', data);
    } catch (error) {
      return SendError(res, 500, `Server Internal`, error);
    }
  }

  static async login(req, res) {
    try {
      const { identifier, password } = req.body;
      const validate = await validateData({ identifier, password });
      if (validate.length > 0)
        return SendError(res, 400, "Bad request", validate.join(','));

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { phone: identifier }],
        },
      });
      if (!user) return SendError(res, 401, "Bad request", "Invalid email/phone or password",);

      const checkPassword = await bcrypt.compare(password, user.password);
      if (!checkPassword) return SendError(res, 401, "Bad request", "Invalid email/phone or password",);

      const accessToken = jwt.sign({ id: user.id, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: "2h" },);
      const refreshToken = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

      const data = {
        ...user,
        accessToken,
        refreshToken,
      };
      data.password = undefined;

      return SendSuccess(res, 'Login Success', data);
    } catch (error) {
      console.log(error);
      return SendError(res, 500, "Sever Internal", error);
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email, newPassword } = req.body;

      const validate = await validateData({ email, newPassword })
      if (validate.length > 0) return SendError(res, 400, 'Bad request', validate.join(','))

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return SendError(res, 401, 'Bad Request', `Invalid email`)

      const hash = await bcrypt.hash(newPassword, 10)

      const data = await prisma.user.update({
        where: { email },
        data: { password: hash },
      })

      return SendSuccess(res, 'Change Password Success', data)
    } catch (error) {
      return SendError(res, 500, "Sever Internal", error);
    }
  }
}
