import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { userRepository } from "./user.repository.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { updateUser } from "./user.controller.js";

toSafeData = (data) => {
  const { password, profilePublicId, ...safeData } = data
  return safeData;
}

export const userService = {
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return toSafeUser(user);
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

  async updateUser(id, input, file) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    
    if ((!input || Object.keys(input).length === 0) && !file) {
      throw new BadRequestError("At least one Change is required to update")
    }
    
    const dataToUpdate = { ...input };

    if(input.phone){
       const existingPhone = await userRepository.findByPhone(dataToUpdate.phone);
        if (existingPhone && existingPhone.id !== id) throw new ConflictError("Phone is already registed");
    }

    if(input.password){
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

  async getOrderHistory(id){
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    const orderHistories = await userRepository.getOrderHistory(id) 
  }
};
