import { SendError, SendSuccess } from "../../utils/response.js";
import { prisma } from "../../config/prisma.config.js";
import { validateData } from "../../services/validate.js";
import UploadImageToCloud from "../../config/cloudinary.js";
export default class OrganizerControllers {
    static async getAllOrganizers(req, res) {
        try {
            const organizers = await prisma.organizer.findMany()
            return SendSuccess(res, 'Organizers retrieved successfully', organizers)
        } catch (error) {
            return SendError(res, 500, 'Server internal', error)
        }
    }

    static async getOrganizerById(req, res){
        try {
            const id = req.params.id;
            const organizer = await prisma.organizer.findUnique({where: id})
            if (!organizer) return SendError(res, 404, 'Organizer not found')
            
            return SendSuccess(res, 'Organizer retrieved successfully', organizer)
        } catch (err) {
            return SendError(res, 500, 'Server internal', err)
        }
    }

    static async createOrganizer(req, res){
        try {
            const {name, email, phone, description} = req.body;
            const validate =  await validateData({name, email, phone, description})
            if (await validate.length > 0) return SendError(res, 400, 'Bad request', `${validate.join(', ')} are require`)
            
            const logo = req.file;
            if(!logo || logo.image) return SendError(res, 400, 'Bad requst', 'Image is required')

            const imgUrl = await UploadImageToCloud(logo.data, logo.mimetype)
            
            const organizer = await prisma.organizer.create({
                data: {
                    name,
                    email,
                    phone,
                    description,
                    image: imgUrl
                }
            })
            return SendSuccess(res, 'Organizer created successfully', organizer)
        } catch (error) {
            return SendError(res, 500, 'Server internal', error)
        }
    }
}