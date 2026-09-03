import UploadImageToCloud from "../config/cloudinary";
import { prisma } from "../config/prisma";
import { SendError, SendSuccess } from "../services/respon";
import { validateData } from "../services/validate";
import bcrypt from "bcryptjs";

export default class UserController {
    static async me(req, res) {
        try {
            const id = req.params.id;
            const user = await prisma.user.findFirst({ where: { id } });
            if (!user) return SendError(res, 404, "User Not Found");
            user.password = undefined;

            return SendSuccess(res, 'ok', user)
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error)
        }
    }

    static async updateProfile(req, res) {
        try {
            const id = req.params.id;
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

            const id = req.params.id
            const user = await prisma.user.findFirst({ where: { id } })
            if (!user) return SendError(res, 404, 'User not found')

            const { oldPassword, newPassword } = req.body;
            const validate = await validateData({ oldPassword, newPassword })
            if (validate.length > 0) return SendError(res, 400, 'Bad request')

            const checkPassword = await bcrypt.compare(oldPassword, user.password)
            if (!checkPassword) return SendError(res, 400, 'Invalid old password')

            const passwordHash = await bcrypt.hash(newPassword, 10)
            const update = await prisma.user.update({
                where: { id },
                data: { password: passwordHash }
            })

            return SendSuccess(res, 'Password Changed', update)
        } catch (error) {
            return SendError(res, 500, 'Server internal', error)
        }
    }


}

