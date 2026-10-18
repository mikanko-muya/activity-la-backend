import { BadRequestError, ConflictError, ForbiddenError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { userRepository } from "./user.repository.js";
import { authRepository } from "../auth/auth.repository.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { toPaginated } from "../../utils/pagination.js";
import { checkExistBy } from "../../utils/resource.js";

const checkExist = checkExistBy(userRepository.findById, "User");

// The admin routes act on someone else's account. Doing these to your own is
// refused: a superadmin who demotes, deactivates or deletes themselves can leave
// nobody able to manage users, and the way back is re-running the seed script.
const assertNotSelf = (id, actingUserId, action) => {
  if (actingUserId && id === actingUserId) {
    throw new ForbiddenError(`You cannot ${action} your own account`);
  }
};

const toSafeData = (data) => {
  const { password, profilePublicId, ...safeData } = data
  return safeData;
}

export const userService = {
  async getUserById(id) {
    return toSafeData(await checkExist(id));
  },

  async getUsers(query) {
    return toPaginated(await userRepository.findMany(query), query, toSafeData);
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

  async updateUser(id, input, file, { actingUserId } = {}) {
    const user = await checkExist(id);

    if (input?.isActive === false) assertNotSelf(id, actingUserId, "deactivate");

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

    // A password reset is often because the account was compromised. Ending
    // every session makes it count: without this, a stolen refresh token went on
    // working for its week. Forgot-password already did the same.
    if (input?.password) await authRepository.revokeAllRefreshTokensForUser(id);

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
    const user = await checkExist(id);

    const isPasswordValid = await comparePassword(input.oldPassword, user.password)
    if (!isPasswordValid) throw new BadRequestError("Invalid Old Password")

    const newHashPassword = await hashPassword(input.newPassword)
    const updatedUser = await userRepository.update(id, { password: newHashPassword })

    return toSafeData(updatedUser)
  },

  async assignRole(id, role, { actingUserId } = {}) {
    assertNotSelf(id, actingUserId, "change the role of");
    const user = await checkExist(id);

    if (user.role === role) {
      throw new BadRequestError(`User already has the role ${role}`);
    }

    return toSafeData(await userRepository.update(id, { role }));
  },

  async deleteUser(id, { actingUserId } = {}) {
    assertNotSelf(id, actingUserId, "delete");
    const user = await checkExist(id);

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
    await checkExist(id);

    return userRepository.findOrderHistory(id);
  }
};
