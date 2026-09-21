import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { userRepository } from "./user.repository.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { createUser, updateUser } from "./user.controller.js";

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
      data: result.data,
      meta: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  },

  async createUser(input, file) {
    const existingPhone = await authRepository.findByPhone(input.phone);
    if (existingPhone) throw new ConflictError("Phone is already registered");

    const hashedPassword = await hashPassword(input.password);

    const dataToCreate = {
      ...input,
      password: hashedPassword,
    }

    let uploadImage = null;
    if (file) {
      uploadImage = await uploadImageBufferToCloudinary(file.buffer, "users");

      dataToCreate.profileUrl = uploadImage.url;
      dataToCreate.profilePublicId = uploadImage.publicId;
    }

    let user
    try {
      user = await userRepository.create(dataToCreate);
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

    return toSafeData(user);
  },

  async updateUser(id, input, file) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    if ((!input || Object.keys(input).length === 0) && !file) {
      throw new BadRequestError("At least one Change is required to update")
    }

    const dataToUpdate = { ...input };

    if (input.phone && input.phone !== user.phone) {
      const existingPhone = await userRepository.findByPhone(dataToUpdate.phone);
      if (existingPhone) throw new ConflictError("Phone is already registed");
    }

    if (input.password) {
      dataToUpdate.password = await hashPassword(input.password)
    }

    let uploadImage = null
    if (file) {
      uploadImage = await uploadImageBufferToCloudinary(file.buffer, "users")

      dataToUpdate.profileUrl = uploadImage.url;
      dataToUpdate.profilePublicId = uploadImage.publicId;
    }

    let updatedUser
    try {
      updatedUser = await userRepository.update(id, dataToUpdate);
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

    if (file && user.profilePublicId) {
      try {
        await deleteImageFromCloudinary(user.profilePublicId);
      } catch (err) {
        console.error("Failed to delete old profile image:", err.message);
      }
    }
    return toSafeData(updatedUser);
  },

  async changePassword(id, input) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    const isPasswordValid = await comparePassword(input.OldPassword, user.password)
    if (!isPasswordValid) throw new BadRequestError("Invalid Old Password")

    const newHashPassword = await hashPassword(input.newPassword)
    const updatedUser = await userRepository.update(id, { password: newHashPassword })

    return toSafeData(updatedUser)
  },

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    const deletedUser = await userRepository.delete(id);

    return toSafeData(deletedUser)
  },

  async getOrderHistory(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    const orderHistories = await userRepository.getOrderHistory(id)
  }
};
