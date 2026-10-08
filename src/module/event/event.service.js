import { BadRequestError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { toPaginated } from "../../utils/pagination.js";
import { checkExistBy } from "../../utils/resource.js";
import { categoryRepository } from "../category/category.repository.js";
import { eventRepository } from "./event.repository.js";

const checkExist = checkExistBy(eventRepository.findById, "Event");
const checkCategoryExist = checkExistBy(categoryRepository.findById, "Category");

const assertRelationsExist = async (input) => {
    const wanted = {
        organizerId: input.organizerId,
        venueId: input.venueId,
        categoryId: input.categoryId,
    };
    if (!wanted.organizerId && !wanted.venueId && !wanted.categoryId) return;

    const { organizer, venue, category } = await eventRepository.findRelations(wanted);

    if (wanted.organizerId && !organizer) throw new NotFoundError("Organizer not found");
    if (wanted.venueId && !venue) throw new NotFoundError("Venue not found");
    if (wanted.categoryId && !category) throw new NotFoundError("Category not found");
};

const PUBLIC_EVENT_STATUS = "PUBLISHED";

export const eventService = {
    async getEventById(id) {
        return checkExist(id);
    },

    async getEvents(query) {
        return toPaginated(await eventRepository.findMany(query), query);
    },

    async getEventsByCategory(categoryId, query) {
        await checkCategoryExist(categoryId);

        return eventService.getEvents({ ...query, categoryId });
    },

    async getPublicEvents(query) {
        return eventService.getEvents({ ...query, eventStatus: PUBLIC_EVENT_STATUS });
    },

    async getPublicEventsByCategory(categoryId, query) {
        await checkCategoryExist(categoryId);

        return eventService.getPublicEvents({ ...query, categoryId });
    },

    async getPublicEventById(id) {
        const event = await eventRepository.findById(id);
        if (!event || event.eventStatus !== PUBLIC_EVENT_STATUS) {
            throw new NotFoundError("Event not found");
        }
        return event;
    },

    async createEvent(input, file) {
        await assertRelationsExist(input);

        if (!file) throw new BadRequestError("Cover image is required");

        const cover = await uploadImageBufferToCloudinary(file.buffer, "events");

        return eventRepository.create({
            ...input,
            coverImgUrl: cover.url,
            coverImgPublicId: cover.publicId,
        });
    },

    async updateEvent(id, input, file) {
        const event = await checkExist(id);

        if ((!input || Object.keys(input).length === 0) && !file) {
            throw new BadRequestError("At least one change is required to update");
        }

        await assertRelationsExist(input);

        const startAt = input.startAt ?? event.startAt;
        const endAt = input.endAt ?? event.endAt;
        if (endAt <= startAt) {
            throw new BadRequestError("endAt must be after startAt");
        }

        const dataToUpdate = { ...input };

        if (file) {
            const cover = await uploadImageBufferToCloudinary(file.buffer, "events");
            dataToUpdate.coverImgUrl = cover.url;
            dataToUpdate.coverImgPublicId = cover.publicId;
        }

        const updated = await eventRepository.update(id, dataToUpdate);

        if (file && event.coverImgPublicId) {
            try {
                await deleteImageFromCloudinary(event.coverImgPublicId);
            } catch (error) {
                console.error("Failed to delete old event cover:", error.message);
            }
        }

        return updated;
    },

    async publishEvent(id) {
        await checkExist(id);

        return eventRepository.update(id, { eventStatus: "PUBLISHED" });
    },

    async cancelEvent(id) {
        await checkExist(id);

        return eventRepository.update(id, { eventStatus: "CANCELLED" });
    },

    async deleteEvent(id) {
        const event = await checkExist(id);

        const deleted = await eventRepository.delete(id);

        if (event.coverImgPublicId) {
            try {
                await deleteImageFromCloudinary(event.coverImgPublicId);
            } catch (error) {
                console.error("Failed to delete event cover:", error.message);
            }
        }

        return deleted;
    },
};
