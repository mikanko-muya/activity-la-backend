import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { buildMeta } from "../../utils/pagination.js";
import { categoryRepository } from "./category.repository.js"

export const categoryService = {
    async getCategoryById (id) {
        const category = await categoryRepository.findById(id);
        if (!category) throw new NotFoundError("Category not found");
        return category;
    },

    async getCategories (query) {
        const result = await categoryRepository.findMany(query);
        return {
            data: result.data,
            meta: buildMeta({ total: result.total, page: query.page, limit: query.limit })
        }
    },

    async createCategory (input, file) {
        const existingName = await categoryRepository.findByName(input.name);
        if (existingName){
            throw new ConflictError(`Category name "${input.name}" already exists`)
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
        const category = await categoryRepository.findById(id);
        if (!category) throw new NotFoundError("Category not found");

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
        const category = await categoryRepository.findById(id);
        if (!category) throw new NotFoundError("Category not found");

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
