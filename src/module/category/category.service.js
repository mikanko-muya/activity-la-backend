import { BadRequestError, ConflictError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { toPaginated } from "../../utils/pagination.js";
import { checkExistBy } from "../../utils/resource.js";
import { categoryRepository } from "./category.repository.js"

const checkExist = checkExistBy(categoryRepository.findById, "Category");

export const categoryService = {
    async getCategoryById (id) {
        return checkExist(id);
    },

    async getCategories (query) {
        return toPaginated(await categoryRepository.findMany(query), query);
    },

    async createCategory (input, file) {
        const existingName = await categoryRepository.findByName(input.name);
        if (existingName){
            throw new ConflictError(`Category name "${input.name}" already exists`)
        }
        const existingNameEn = await categoryRepository.findByNameEn(input.nameEn);
        if (existingNameEn) {
            throw new ConflictError(`Category name "${input.nameEn}" already exists`);
        }

        const data = { ...input };

        if (file) {
            const icon = await uploadImageBufferToCloudinary(file.buffer, "categoryIcons")
            data.iconUrl = icon.url;
            data.iconPublicId = icon.publicId;
        }

        return categoryRepository.create(data);
    },

    async updateCategory (id, input, file) {
        const category = await checkExist(id);

        if ((!input || Object.keys(input).length === 0) && !file) {
            throw new BadRequestError("At least one change is required to update");
        }

        const dataToUpdate = { ...input };

        if (input?.name && input.name !== category.name) {
            const existingName = await categoryRepository.findByName(input.name);
            if (existingName && existingName.id !== id) {
                throw new ConflictError(`Category name "${input.name}" already exists`);
            }
        }

        if (input?.nameEn && input.nameEn !== category.nameEn) {
            const existingNameEn = await categoryRepository.findByNameEn(input.nameEn);
            if (existingNameEn && existingNameEn.id !== id) {
                throw new ConflictError(`Category name "${input.nameEn}" already exists`);
            }
        }

        if (file) {
            const icon = await uploadImageBufferToCloudinary(file.buffer, "categoryIcons");
            dataToUpdate.iconUrl = icon.url;
            dataToUpdate.iconPublicId = icon.publicId;
        }

        const updated = await categoryRepository.update(id, dataToUpdate);

        if (file && category.iconPublicId) {
            try {
                await deleteImageFromCloudinary(category.iconPublicId);
            } catch (error) {
                console.error("Failed to delete old category icon:", error.message);
            }
        }

        return updated;
    },

    async deleteCategory (id) {
        const category = await checkExist(id);

        const deleted = await categoryRepository.delete(id);

        if (category.iconPublicId) {
            try {
                await deleteImageFromCloudinary(category.iconPublicId);
            } catch (error) {
                console.error("Failed to delete category icon:", error.message);
            }
        }

        return deleted;
    },
}
