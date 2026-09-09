import { SendError } from "../utils/response.js";

export default class venueController{
    static async getVenues(req, res){
        try {
            
            
        } catch (error) {
            return SendError(res, 500, 'Server internal', error)
        }
    }
}