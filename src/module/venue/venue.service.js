import { NotFoundError } from "../../utils/errors/index.js";
import { venueReposiotry } from "./venue.repository.js";

export const venueService = {
    async getVenueById(id) {
        const venue = await venueReposiotry.findById(id);
        if (!venue) throw new NotFoundError("Venue not found");
        return venue;
    },

    async getVenues(query) {
        const result = await venueReposiotry.findMany(query);
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
        const venue = await venueReposiotry.create(input);
        return venue;
    },

    async updateVenue(id, input) {
        const venue = await venueReposiotry.findById(id);
        if (!venue) throw new NotFoundError("Venue not found");

        const updatedVenue = await venueReposiotry.update(id, input)
        return updatedVenue;
    },

    async deletevenue(id) {
        const venue = await venueReposiotry.findById(id);
        if (!venue) throw new NotFoundError("Venue not found");

        const deletedVenue = await venueReposiotry.delete(id);
        return deletedVenue;
    }

}