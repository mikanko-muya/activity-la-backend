import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { deleteImageFromCloudinary, uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { categoryRepository } from "./category.repository.js"


export const categoryService = {
    async getCategoryById (id) {
        const category = await categoryRepository.findById(id);
        // FIX: used to return null, so a missing category answered 200 with data: null.
        if (!category) throw new NotFoundError("Category not found");
        return category;
    },

    async getCategories (query) {
        const result = await categoryRepository.findMany(query);
        return {
            data: result.data,
            meta: {
                total: result.total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(result.total/ query.limit)
            }
        }
    },

    async createCategory (input, file) {
        // FIX: this called findById(input.name) - looking a name up by primary key
        // never matched, so duplicate names slipped past and only failed later on
        // the DB unique constraint.
        const existingName = await categoryRepository.findByName(input.name);
        if (existingName){
            throw new ConflictError(`Category name "${input.name}" already exists`)
        }

        const data = { ...input };

        // FIX: file was assumed to exist (file.buffer threw on a request with no
        // icon). The icon is optional now.
        if (file) {
            const icon = await uploadImageBufferToCloudinary(file.buffer, "categoryIcons")
            data.iconUrl = icon.url;
            data.iconPublicId = icon.publicId;
        }

        return categoryRepository.create(data);
    },

    // FIX: was an empty function body - the route answered 200 with data: undefined.
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

        // Drop the replaced image only after the DB write succeeded, so a failed
        // update never leaves the record pointing at a deleted Cloudinary asset.
        if (file && category.iconPublicId) {
            try {
                await deleteImageFromCloudinary(category.iconPublicId);
            } catch (error) {
                console.error("Failed to delete old category icon:", error.message);
            }
        }

        return updated;
    },

    // FIX: was an empty function body.
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
