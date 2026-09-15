// import { SendCreate, SendError, SendSuccess } from "../../utils/response.js";
// import { prisma } from "../../config/prisma.config.js"
// import { validateData } from "../../services/validate.js";
// export default class venueController {
//     static async getAllVenues(req, res) {
//         try {
//             const venues = await prisma.venue.findMany()
//             return SendSuccess(res, 'Venues retrieved successfully', venues)

//         } catch (error) {
//             return SendError(res, 500, 'Server internal', error)
//         }
//     }

//     static async getVenueById(req, res) {
//         try {
//             const id = req.params.id
//             const venue = await prisma.venue.findUnique({ where: {id}})
//             if (!venue) return SendError(res, 404, 'Venue not found')

//             return SendSuccess(res, 'Venue retrieved successfully', venue)
//         } catch (error) {
//             return SendError(res, 500, 'Server internal', error)
//         }
//     }

//     static async getVenueByProvince(req, res) {
//         try {
//             const search = req.query
//             const data = prisma.venue.findMany({
//                 where: {...(search && )}
//             })
//         } catch (error) {
//             return SendError(res, 500, 'Server internal', error)
//         }
//     }

//     static async createVenue(req, res) {
//         try {
//             const { name, address, province, mapUrl } = req.body
//             const validate = await validateData({ name, address, mapUrl, province })
//             if (validate.length > 0) return SendError(res, 400, 'Bad requset', `${validate.join(', ')} are require`)

//             const venue = await prisma.venue.create({
//                 data: {
//                     name,
//                     province,
//                     address,
//                     mapUrl
//                 }
//             })
//             return SendCreate(res, 'Venue created successfully', venue)
//         } catch (error) {
//             return SendError(res, 500, 'Server internal', error)
//         }
//     }

//     static async updateVenue(req, res) {
//         try {
//             const id = req.params.id;
//             const venue = await prisma.venue.findUnique({ where: { id } });
//             if (!venue) return SendError(res, 404, 'Venue not found')

//             const { name, address, province, mapUrl } = req.body
//             const validate = await validateData({ name, address, mapUrl, province })
//             if (validate.length > 0) return SendError(res, 400, 'Bad requset', `${validate.join(', ')} are require`)

//             const data = await prisma.venue.update({
//                 data: {
//                     name,
//                     province,
//                     address,
//                     mapUrl
//                 },
//                 where: { id }
//             })

//             return SendSuccess(res, 'Venue updated successfully', venue)
//         } catch (error) {
//             return SendError(res, 500, 'Server internal', error)
//         }
//     }

//     static async deleteVenue(req, res) {
//         try {
//             const id = req.params.id;
//             const venue = await prisma.venue.findUnique({ where: { id } });
//             if (!venue) return SendError(res, 404, 'Venue not found');

//             const data = await prisma.venue.delete({ where: { id } });
//             return SendSuccess(res, 'Venue deleted successfully', data);
//         } catch (error) {
//             return SendError(res, 500, 'Server internal', error);
//         }
//     }
// }