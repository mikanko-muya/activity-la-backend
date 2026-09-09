import UploadImageToCloud from "../config/cloudinary";
import { prisma } from "../config/prisma.js";
import { SendError, SendSuccess } from "../utils/response.js";
import { validateData } from "../services/validate.js";
import { comparePassword, hashPassword} from "../utils/password.js";

const safeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
}

export default class UserController {
    static async me(req, res) {
        try {
            const id = req.user.id;
            const user = await prisma.user.findUnique({ where: { id }});
            if (!user) return SendError(res, 404, 'User Not Found');

            return SendSuccess(res, 'User Found', safeUser(user));
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error)
        }
    }

    static async updateProfile(req, res) {
        try {
            const id = req.user.id;
            const user = await prisma.user.findFirst({ where: { id } });
            if (!user) return SendError(res, 404, "User Not Found");

            const { name, phone, oldImage } = req.body
            const validate = await validateData({ name, phone })
            if (validate.length > 0) return SendError(res, 400, 'Bad request', validate.join(','))

            const profile = req.file
            if (!profile || profile.file) return SendError(res, 400, 'Bad requset')

            const imageUrl = await UploadImageToCloud(profile.data, profile.mimetype, oldImage)
            const update = await prisma.user.update({
                where: { id },
                data: {
                    name,
                    phone,
                    profileUrl: imageUrl
                },
            })

            return SendSuccess(res, 'Update Profile Success', update)
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error)
        }
    }

    static async changePassword(req, res) {
        try {

            const id = req.user.id
            const user = await prisma.user.findUnique({ where: { id } })
            if (!user) return SendError(res, 404, 'User not found')

            const { currentPassword, newPassword } = req.body;
            const validate = await validateData({ currentPassword, newPassword })
            if (validate.length > 0) return SendError(res, 400, 'Bad request', `${validate.join(', ')} are required`)

            const validPassword = await comparePassword(currentPassword, user.password)
            if (!validPassword) return SendError(res, 401, 'Invalid current password')

            const passwordHash = await hashPassword(newPassword)
            const data = await prisma.user.update({
                where: { id },
                data: { password: passwordHash }
            })

            return SendSuccess(res, 'Password changed successfully', safeUser(data))
        } catch (error) {
            return SendError(res, 500, 'Server internal', error)
        }
    }

    static async deleteAccount(req, res) {
        try {
            const id = req.user.id
            const user = await prisma.user.findFirst({ where: { id } })
            if (!user) return SendError(res, 404, 'User not found')

            const data =await prisma.user.delete({ where: { id } })
            return SendSuccess(res, 'Account deleted successfully', safeUser(data))
        } catch (error) {
            return SendError(res, 500, 'Server internal', error)
        }
    }

    static async getOrderHistory(req, res) {
        try {
            const id = req.user.id
            const user = await prisma.user.findFirst({ where: { id } })
            if (!user) return SendError(res, 404, 'User not found')

            const orders = await prisma.order.findMany({ where: { userId: id } , orderBy: { createdAt: 'desc' }})

            return SendSuccess(res, 'Order history retrieved successfully', orders)
        } catch (error) {
            return SendError(res, 500, 'Server internal', error)
        }
    }
   }
