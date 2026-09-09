import { SendError, SendSuccess } from "../utils/response.js";
import { prisma} from "../config/prisma.js"
export default class venueController{
    static async getAllVenues(req, res){
        try {
            const venues = await prisma.venue.findMany()
            return SendSuccess(res, 'Venues retrieved successfully', venues)
            
        } catch (error) {
            return SendError(res, 500, 'Server internal', error)
        }
    }

    static async create
}