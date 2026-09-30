import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { userRepository } from "./user.repository.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { buildMeta } from "../../utils/pagination.js";

const toSafeData = (data) => {
  const { password, profilePublicId, ...safeData } = data
  return safeData;
}

export const userService = {
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return toSafeData(user);
  },

  async getUsers(query) {
    const result = await userRepository.findMany(query);
    return {
      data: result.data.map(toSafeData),
      meta: buildMeta({ total: result.total, page: query.page, limit: query.limit }),
    };
  },

  async createUser(input) {
    const existingPhone = await userRepository.findByPhone(input.phone);
    if (existingPhone) throw new ConflictError("Phone is already registered");

    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) throw new ConflictError("Email is already registered");

    const user = await userRepository.create({
      ...input,
      password: await hashPassword(input.password),
    });

    return toSafeData(user);
  },

  async updateUser(id, input, file) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    if ((!input || Object.keys(input).length === 0) && !file) {
      throw new BadRequestError("At least one Change is required to update")
    }

    const dataToUpdate = { ...input };

    if (input?.phone) {
      const existingPhone = await userRepository.findByPhone(input.phone);
      if (existingPhone && existingPhone.id !== id) throw new ConflictError("Phone is already registed");
    }

    if (input?.email) {
      const existingEmail = await userRepository.findByEmail(input.email);
      if (existingEmail && existingEmail.id !== id) throw new ConflictError("Email is already registed");
    }

    if (input?.password) {
      dataToUpdate.password = await hashPassword(input.password)
    }

    if (file) {
      const newImage = await uploadImageBufferToCloudinary(file.buffer, "users")

      dataToUpdate.profileUrl = newImage.url;
      dataToUpdate.profilePublicId = newImage.publicId;
    }

    const updatedUser = await userRepository.update(id, dataToUpdate)

    if (file && user.profilePublicId) {
      try {
        await deleteImageFromCloudinary(user.profilePublicId);
      } catch (error) {
        console.error("Failed to delete old profile image:", error.message);
      }
    }
    return toSafeData(updatedUser);
  },

  async changePassword(id, input) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    const isPasswordValid = await comparePassword(input.oldPassword, user.password)
    if (!isPasswordValid) throw new BadRequestError("Invalid Old Password")

    const newHashPassword = await hashPassword(input.newPassword)
    const updatedUser = await userRepository.update(id, { password: newHashPassword })

    return toSafeData(updatedUser)
  },

  async assignRole(id, role) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    if (user.role === role) {
      throw new BadRequestError(`User already has the role ${role}`);
    }

    return toSafeData(await userRepository.update(id, { role }));
  },

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    const deletedUser = await userRepository.delete(id);

    if (user.profilePublicId) {
      try {
        await deleteImageFromCloudinary(user.profilePublicId);
      } catch (error) {
        console.error("Failed to delete profile image:", error.message);
      }
    }

    return toSafeData(deletedUser)
  },

  async getOrderHistory(id){
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    return userRepository.findOrderHistory(id);
  }
};
