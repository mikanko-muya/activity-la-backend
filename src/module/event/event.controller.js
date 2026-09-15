import { validateData } from "../../services/validate.js";
import { prisma } from "../../config/prisma.config.js";
import { SendError, SendSuccess, SendCreate } from "../../utils/response.js";
import UploadImageToCloud from "../../config/cloudinary.js";

export default class EventControllers {
  // @ts-ignore
  static async getAllEvents(req, res) {
    try {
      const events = await prisma.event.findMany({
        include: {
          organizer: true,
          venue: true,
          category: true,
        },
      });
      return SendSuccess(res, "Events retrieved successfully", events);
    } catch (error) {
      return SendError(res, 500, "Internal server error", error);
    }
  }

  static async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          organizer: true,
          venue: true,
          category: true,
        },
      });
      if (!event) return SendError(res, 404, "Event not found");
      return SendSuccess(res, "Event retrieved successfully", event);
    } catch (error) {
      return SendError(res, 500, "Internal server error", error);
    }
  }

  static async getEventsByCategory(req, res) {
    try {
      const categoryId  = req.params.categoryId;
      const category = await prisma.category.findUnique({where: {id: categoryId}});

      if (!category) return SendError(res, 404, 'Bad request', 'Category not found')
      const events = await prisma.event.findMany({
        where: { categoryId},
        include: {
          organizer: true,
          venue: true,
          category: true,
        },
      });
      return SendSuccess(res, "Events retrieved successfully", events);
    } catch (error) {
      return SendError(res, 500, "Internal server error", error);
    }
  }

  static async searchEvent(req, res){
    try {
      const {search} = req.query

      const 
      
    } catch (error) {
      
    }
  }

  // @ts-ignore
  static async createEvent(req, res) {
    try {
      const {
        title,
        description,
        startAt,
        endAt,
        isFree,
        organizerId,
        venueId,
        categoryId,
      } = req.body;
      const validate = await validateData({
        title,
        description,
        startAt,
        endAt,
        isFree,
        organizerId,
        venueId,
        categoryId,
      });
      if (validate.length > 0)
        return SendError(
          res,
          400,
          "Bad request",
          `${validate.join(",")} are required`,
        );

      const [organizer, venue, category] = await Promise.all([
        prisma.organizer.findUnique({ where: { id: organizerId } }),
        prisma.venue.findUnique({ where: { id: venueId } }),
        prisma.category.findUnique({ where: { id: categoryId } }),
      ]);
      if (!organizer) return SendError(res, 404, "Organizer not found");
      if (!venue) return SendError(res, 404, "Venue not found");
      if (!category) return SendError(res, 404, "Category not found");

      const file = req.file;
      if (!file || !file.image)
        return SendError(res, 400, "Bad request", "Image is required");
      const imageUrl = await UploadImageToCloud(
        file.image.data,
        file.image.mimetype,
      );

      const event = await prisma.event.create({
        include: {
          organizer: true,
          venue: true,
          category: true,
        },
        data: {
          title,
          description,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          isFree,
          coverImage: imageUrl,
          organizerId,
          venueId,
          categoryId,
        },
      });
      return SendCreate(res, "Event created successfully", event);
    } catch (error) {
      return SendError(res, 500, "Internal server error", error);
    }
  }

  static async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) return SendError(res, 404, "Event not found");
      const {
        title,
        description,
        startAt,
        endAt,
        isFree,
        organizerId,
        venueId,
        categoryId,
      } = req.body;
      const validate = await validateData({
        title,
        description,
        startAt,
        endAt,
        isFree,
        organizerId,
        venueId,
        categoryId,
      });
      if (validate.length > 0)
        return SendError(
          res,
          400,
          "Bad request",
          `${validate.join(",")} are required`,
        );

      const [organizer, venue, category] = await Promise.all([
        prisma.organizer.findUnique({ where: { id: organizerId } }),
        prisma.venue.findUnique({ where: { id: venueId } }),
        prisma.category.findUnique({ where: { id: categoryId } }),
      ]);
      if (!organizer) return SendError(res, 404, "Organizer not found");
      if (!venue) return SendError(res, 404, "Venue not found");
      if (!category) return SendError(res, 404, "Category not found");

      const file = req.file;
      if (file && file.image) {
        const imageUrl = await UploadImageToCloud(
          file.image.data,
          file.image.mimetype,
        );

        const data = await prisma.event.update({
          include: {
            organizer: true,
            venue: true,
            category: true,
          },
          where: { id },
          data: {
            title,
            description,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            isFree,
            coverImage: imageUrl,
            organizerId,
            venueId,
            categoryId,
          },
        });
        return SendSuccess(res, "Event updated successfully", data);
      } else {
        const data = await prisma.event.update({
          where: { id },
          data: {
            title,
            description,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            isFree,
            organizerId,
            venueId,
            categoryId,
          },
        });
        return SendSuccess(res, "Event updated successfully", data);
      }
    } catch (error) {
      return SendError(res, 500, "Internal server error", error);
    }
  }

  static async publishEvent(req, res) {
    try {
      const { id } = req.params.id;
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) return SendError(res, 404, "Event not found");
      
      const data = await prisma.event.update({
        where: { id },
        data: { status: "PUBLISHED" },
      });
      return SendSuccess(res, "Event published successfully", data);
    } catch (error) {
      return SendError(res, 500, "Internal server error", error);
    }
  }

  static async cancelEvent(req, res) {
    try {
      const id =req.params.id;
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) return SendError(res, 404, "Event not found");
      
      const data = await prisma.event.update({
        where: { id },
        data: { status: "CANCELED" },
      });
      return SendSuccess(res, "Event canceled successfully", data);
    } catch (error) {
      return SendError(res, 500, "Internal server error", error);
    }
  }

  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) return SendError(res, 404, "Event not found");
      const data = await prisma.event.delete({ where: { id } });
      return SendSuccess(res, "Event deleted successfully", data);
    } catch (error) {
      return SendError(res, 500, "Internal server error", error);
    }
  }
}
