import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { userRepository } from "./user.repository.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { buildMeta } from "../../utils/pagination.js";
// FIX: removed `import { updateUser } from "./user.controller.js"` - unused, and
// it made service and controller import each other in a cycle.

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

  // FIX: user.controller.js called userService.createUser, which did not exist
  // (the route answered 500 "createUser is not a function"). This is the
  // admin-side create; public signup still goes through authService.register.
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

    // FIX: these read `input.phone` / `input.password` unguarded. The controller
    // was passing req.file in the `input` slot, so input could be undefined and
    // this threw before reaching the update. Optional chaining plus the fixed
    // controller call keeps it safe either way.
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

    // FIX: read input.OldPassword (capital O) while changePasswordSchema defines
    // `oldPassword`. comparePassword got undefined, so this always answered
    // "Invalid Old Password" and nobody could ever change their password.
    const isPasswordValid = await comparePassword(input.oldPassword, user.password)
    if (!isPasswordValid) throw new BadRequestError("Invalid Old Password")

    const newHashPassword = await hashPassword(input.newPassword)
    const updatedUser = await userRepository.update(id, { password: newHashPassword })

    return toSafeData(updatedUser)
  },

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    const deletedUser = await userRepository.delete(id);

    // Clean up the avatar after the row is gone, so a Cloudinary hiccup does not
    // block the delete. Failure here is logged, not fatal.
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

    // FIX: called userRepository.getOrderHistory, but the repository method is
    // named findOrderHistory - this threw "is not a function".
    return userRepository.findOrderHistory(id);
  }
};
