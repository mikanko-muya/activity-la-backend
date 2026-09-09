import { SendError, SendSuccess, SendCreate } from "../utils/response.js";
import { prisma } from "../config/prisma.js";
import { validateData } from "../services/validate.js";

export default class CategoryControllers {
    // @ts-ignore
    static async getAllCategories(req, res) {
        try {
            const data = await prisma.category.findMany();
            return SendSuccess(res, 'Categories retrieved successfully', data);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    // @ts-ignore
    static async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const data = await prisma.category.findUnique({ where: { id } });
            if (!data) return SendError(res, 404, 'Category not found');
            return SendSuccess(res, 'Category retrieved successfully', data);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    // @ts-ignore
    static async searchCategory(req, res) {
        try {
            const { search } = req.query;
            const data = await prisma.category.findMany({
                where: { name: { contains: search, mode: 'insensitive' } }
            });

            return SendSuccess(res, 'Search category successfully', data);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    // @ts-ignore
    static async createCategory(req, res) {
        try {
            const { name, description } = req.body;
            const existingCategory = await prisma.category.findUnique({ where: { name } });
            if (existingCategory) return SendError(res, 409, 'Category already exists');
            const data = await prisma.category.create({
                data: {
                    name,
                    description,
                }
            });
            return SendCreate(res, 'Category created successfully', data);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    // @ts-ignore
    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const category = await prisma.category.findUnique({ where: { id } });
            if (!category) return SendError(res, 404, 'Category not found');

            const { name, description } = req.body;
            const validate = await validateData({ name, description });
            if (validate.length > 0) return SendError(res, 400, 'Bad request', `${validate.join(', ')} are required`);
            
            const data = await prisma.category.update({
                where: { id },
                data: {
                    name,
                    description
                }
            });

            return SendSuccess(res, 'Category updated successfully', data);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    // @ts-ignore
    static async deleteCategory(req, res) {
        try{
            const { id } =req.params
            const data= await prisma.category.delete( { where: {id}})
            return SendSuccess(res, 'Category deleted successfully', data)

        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
    }
}
}