import { ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { categoryRepository } from "./category.repository.js"


export const categoryService = {
    async getCategoryById(id) {
        const category = await categoryRepository.findById(id);
        if (!category) throw new NotFoundError("Category not found");
        return category;
    },

    async getCategories(query) {
        const result = await categoryRepository.findMany(query);
        return {
            data: result.data,
            meta: {
                total: result.total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(result.total / query.page)
            }
        }
    },

    async createCategory(input, file) {
        const existingName = await categoryRepository.findByName(input.name);
        if (existingName) {
            throw new ConflictError(`Category name "${input.name}" already exists`)
        }

        let uploadIcon = null
        if (file) {
            uploadIcon = await uploadImageBufferToCloudinary(file.buffer, "categoryIcons")
            input.iconUrl = uploadIcon.url;
            input.iconPublicId = uploadIcon.publicId;
        }

        let category
        try {
            category = await categoryRepository.create(input)
        } catch (err) {
            if (uploadIcon?.publicId) {
                try {
                    await deleteImageFromCloudinary(uploadIcon.publicId)
                } catch (rollbackError) {
                    console.error("Failed to rollback uploaded image: ", rollbackError.message);
                }
            }

            throw err
        }

        return category;
    },

    async updateCategory(id, input, file) {
        const category = await categoryRepository.findById(id);
        if (!category) throw new NotFoundError("Category not found");

        if (input.name && input.name !== category.name) {
            const existingName = await categoryRepository.findById(input.name);
            if (existingName) throw new ConflictError(`Category name "${input.name}" already exists`)
        }

        let uploadIcon = null
        if (file) {
            uploadIcon = await uploadImageBufferToCloudinary(file.buffer, "categoryIcons")
            input.iconUrl = uploadIcon.url;
            input.iconPublicId = uploadIcon.publicId;
        }

        let updatedCategory
        try {
            updatedCategory = await categoryRepository.update(id, input)
        } catch (err) {
            if (uploadIcon?.publicId) {
                try {
                    await deleteImageFromCloudinary(uploadIcon.publicId)
                } catch (rollbackError) {
                    console.error("Failed to rollback uploaded image: ", rollbackError.message);
                }
            }

            throw err
        }

        if (file && category.iconPublicId) {
            try {
                await deleteImageFromCloudinary(category.publicId)
            } catch (err) {
                console.error("Failed to delete old profile image: ", err.message);
            }
        }

        return updatedCategory;
    },

    async deleteCategory(id) {
        const category = await categoryRepository.findById(id);
        if (!category) throw new NotFoundError("Category not found");

        const deletedCategory = await categoryRepository.delete(id);
        
        return deletedCategory;
    },


}