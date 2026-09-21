import { NotFoundError } from "../../utils/errors/index.js";
import { eventRepository } from "./event.repository.js";

assertReferencesExist = async ({ organizerId, venueId, categoryId }) => {
    if (organizerId) {
        const exists = await eventRepository.organizerExists(organizerId);
        if (!exists) throw new NotFoundError(`Organizer with id "${organizerId}" not found`);
    }
    if (venueId) {
        const exists = await eventRepository.venueExists(venueId);
        if (!exists) throw new NotFoundError(`Venue with id "${venueId}" not found`);
    }
    if (categoryId) {
        const exists = await eventRepository.categoryExists(categoryId);
        if (!exists) throw new NotFoundError(`Category with id "${categoryId}" not found`);
    }
};

export const eventService = {
    async getEvent(id) {
        const event = await eventRepository.findById(id);
        if (!event) throw new NotFoundError("Event not found");
        return event;
    },

    async getEvents(query) {
        const result = await eventRepository.findMany(query);
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

    async createEvent(input, file) {
        await assertReferencesExist(input);

        let uploadImage = null;
        if (file) {
            uploadImage = await uploadImageBufferToCloudinary(file.buffer, "eventCoverImage")
            input.coverImageUrl = uploadImage.url;
            input.coverImagePublic = uploadImage.publicId;
        }

        let event
        try {
            event = await eventRepository.create(input)
        } catch (err) {
            if (uploadImage?.publicId) {
                try {
                    await deleteImageFromCloudinary(uploadImage.publicId)
                } catch (rollbackError) {
                    console.error("Failed to rollback uploaded image: ", rollbackError.message);
                }
            }

            throw err
        }

        return event;
    },

    async updateEvent(id, input, file) {
        const event = await eventRepository.findById(id);
        if (!event) throw new NotFoundError("Event not found");

        await assertReferencesExist(input)

        if (input.startAt || input.endAt) {
            const startAt = input.startAt ?? event.startAt;
            const endAt = input.endAt ?? event.endAt;

            if (endAt <= startAt) {
                throw new BadRequestError("endAt must be later than startAt");
            }
        }

        let uploadImage = null;
        if (file) {
            uploadImage = await uploadImageBufferToCloudinary(file.buffer, "eventCoverImage")
            input.coverImageUrl = uploadImage.url;
            input.coverImagePublic = uploadImage.publicId;
        }

        let updatedEvent
        try {
            updatedEvent = await eventRepository.create(input)
        } catch (err) {
            if (uploadImage?.publicId) {
                try {
                    await deleteImageFromCloudinary(uploadImage.publicId)
                } catch (rollbackError) {
                    console.error("Failed to rollback uploaded image: ", rollbackError.message);
                }
            }

            throw err
        }

        return updatedEvent;
    },

    async deleteEvent(id) {
        const event = await eventRepository.findById(id),
        if (!event) throw new NotFoundError("Event not found");

        const deletedEvent = await eventRepository.delete(id),
        return deletedEvent

    }

}


