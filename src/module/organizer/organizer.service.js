import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { buildMeta } from "../../utils/pagination.js";
import { organizerRepository } from "./organizer.repository.js"

const paginated = (result, query) => ({
  data: result.data,
  meta: buildMeta({ total: result.total, page: query.page, limit: query.limit }),
});

const assertEmailAvailable = async (email, currentId) => {
  if (!email) return;

  const existing = await organizerRepository.findByEmail(email);
  if (existing && existing.id !== currentId) {
    throw new ConflictError("An organizer with this email already exists");
  }
};

const asConflict = (error) =>
  error?.code === "P2002"
    ? new ConflictError("An organizer with this email already exists")
    : error;

export const organizerService = {
  async getOrganizerById(id) {
    const organizer = await organizerRepository.findById(id);
    if (!organizer) throw new NotFoundError("Organizer not found");
    return organizer;
  },

  async getOrganizers(query) {
    return paginated(await organizerRepository.findMany(query), query);
  },

  async getPublicOrganizerById(id) {
    const organizer = await organizerRepository.findByIdPublic(id);
    if (!organizer) throw new NotFoundError("Organizer not found");
    return organizer;
  },

  async getPublicOrganizers(query) {
    return paginated(await organizerRepository.findManyPublic(query), query);
  },

  async createOrganizer(input, file) {
    await assertEmailAvailable(input.email);

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
        } catch (rollbackErr) {
          console.error("Failed to rollback uploaded image: ", rollbackErr.message);
        }
      }

      throw asConflict(err);
    }

    return organizer;
  },

  async updateOrganizer(id, input, file) {
    const organizer = await organizerRepository.findById(id);
    if (!organizer) throw new NotFoundError("Organizer not found");

    if ((!input || Object.keys(input).length === 0) && !file) {
      throw new BadRequestError("At least one Change is required to update")
    }

    await assertEmailAvailable(input?.email, id);

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
        } catch (rollbackErr) {
          console.error("Failed to rollback uploaded image: ", rollbackErr.message);
        }
      }

      throw asConflict(err);
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

  async deleteOrganizer(id) {
    const organizer = await organizerRepository.findById(id);
    if (!organizer) throw new NotFoundError("Organizer not found");

    const eventCount = await organizerRepository.countEvents(id);
    if (eventCount > 0) {
      throw new ConflictError(`Organizer still has ${eventCount} event(s)`);
    }

    const deletedOrganizer = await organizerRepository.delete(id);

    if (organizer.logoPublicId) {
      try {
        await deleteImageFromCloudinary(organizer.logoPublicId);
      } catch (err) {
        console.error("Failed to delete logo image:", err.message);
      }
    }

    return deletedOrganizer;
  },
};
