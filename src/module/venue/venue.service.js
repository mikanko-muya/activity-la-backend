import { toPaginated } from "../../utils/pagination.js";
import { checkExistBy } from "../../utils/resource.js";
import { venueRepository } from "./venue.repository.js";

const checkExist = checkExistBy(venueRepository.findById, "Venue");

export const venueService = {
    async getVenueById(id) {
        return checkExist(id);
    },

    async getVenues(query) {
        return toPaginated(await venueRepository.findMany(query), query);
    },

    async createVenue(input) {
        const venue = await venueRepository.create(input);
        return venue;
    },

    async updateVenue(id, input) {
        await checkExist(id);

        const updatedVenue = await venueRepository.update(id, input)
        return updatedVenue;
    },

    async deleteVenue(id) {
        await checkExist(id);

        const deletedVenue = await venueRepository.delete(id);
        return deletedVenue;
    }

}