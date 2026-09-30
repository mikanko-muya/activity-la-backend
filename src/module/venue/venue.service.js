import { NotFoundError } from "../../utils/errors/index.js";
import { venueRepository } from "./venue.repository.js";

export const venueService = {
    async getVenueById(id) {
        const venue = await venueRepository.findById(id);
        if (!venue) throw new NotFoundError("Venue not found");
        return venue;
    },

    async getVenues(query) {
        const result = await venueRepository.findMany(query);
        return {
            data: result.data,
            meta: {
                total: result.total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(result.total / query.limit),
            }
        }
    },

    async createVenue(input) {
        const venue = await venueRepository.create(input);
        return venue;
    },

    async updateVenue(id, input) {
        const venue = await venueRepository.findById(id);
        if (!venue) throw new NotFoundError("Venue not found");

        const updatedVenue = await venueRepository.update(id, input)
        return updatedVenue;
    },

    async deleteVenue(id) {
        const venue = await venueRepository.findById(id);
        if (!venue) throw new NotFoundError("Venue not found");

        const deletedVenue = await venueRepository.delete(id);
        return deletedVenue;
    }

}