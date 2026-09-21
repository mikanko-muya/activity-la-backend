import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { organizerRepository } from "./organizer.repository.js"

export const organizerService = {
  async getorganizerById(id) {
    const organizer = await organizerRepository.findById(id);
    if (!organizer) throw new NotFoundError("organizer not found");
    return organizer;
  },

  async getorganizers(query) {
    const result = await organizerRepository.findMany(query);
    return {
      data: result.data,
      meta: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  },

  async createorganizer(input, file) {
    
    let uploadImage = null;
    if (file) {
      uploadImage = await uploadImageBufferToCloudinary(file.buffer, "organizers");

      input.logoUrl = uploadImage.url;
      input.logoPublicId = uploadImage.publicId;
    }

    let organizer
    try {
      organizer = await organizerRepository.create(input);
    } catch (err) {
      if (uploadImage?.publicId) {
        try {
          await deleteImageFromCloudinary(uploadImage.publicId);
        } catch (err) {
          console.error("Failed to rollback uploaded image: ", err.message);
        }
      }

      throw err;
    }

    return organizer;
  },

  async updateorganizer(id, input, file) {
    const organizer = await organizerRepository.findById(id);
    if (!organizer) throw new NotFoundError("organizer not found");

    if ((!input || Object.keys(input).length === 0) && !file) {
      throw new BadRequestError("At least one Change is required to update")
    }

    let uploadImage = null
    if (file) {
      uploadImage = await uploadImageBufferToCloudinary(file.buffer, "organizers")

      input.logoUrl = uploadImage.url;
      input.logoPublicId = uploadImage.publicId;
    }

    let updatedOrganizer
    try {
      updatedOrganizer = await organizerRepository.update(id, input);
    } catch (err) {
      if (uploadImage?.publicId) {
        try {
          await deleteImageFromCloudinary(uploadImage.publicId)
        } catch (err) {
          console.error("Failed to rollback uploaded image: ", err.message);
        }
      }

      throw err;
    }

    if (file && organizer.logoPublicId) {
      try {
        await deleteImageFromCloudinary(organizer.logoPublicId);
      } catch (err) {
        console.error("Failed to delete old logo image:", err.message);
      }
    }
    return updatedOrganizer;
  },

  async deleteorganizer(id) {
    const organizer = await organizerRepository.findById(id);
    if (!organizer) throw new NotFoundError("organizer not found");

    const deletedOrganizer = await organizerRepository.delete(id);

    return deletedOrganizer;
  },

};
