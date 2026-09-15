import { ConflictError } from "../../utils/errors/index.js";
import { uploadImageBufferToCloudinary } from "../../utils/uploadImage.js";
import { categoryRepository } from "./category.repository.js"


export const categoryService = {
    async getCategoryById (id) {
        const category = await categoryRepository.findById(id);
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
                totalPages: Math.ceil(result.total/ query.page)
            }
        }
    },

    async createCategory (input, file) {
        const existingName = await categoryRepository.findById(input.name);
        if (existingName){
            throw new ConflictError(`Category name "${input.name}" already exists`)
        }

        const icon = await uploadImageBufferToCloudinary(file.buffer, "categoryIcons")

        const category = await categoryRepository.create({
            ...input,
            iconUrl: icon.url,
            iconPublicId: icon.publicId
        })

        return category;
    },

    async updateCategory (input) {
    },

    async deleteCategory (input) {
    },

   
}