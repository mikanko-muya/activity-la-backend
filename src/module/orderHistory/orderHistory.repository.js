import { prisma } from "../../config/prisma.config.js";


export const OrderHistoryRepository = {
    findOrderHistoryById: (id) => { return prisma.orderHistory.findMany({ where: { id } }) } ,
    findOrderHistoryByUserId: (userId) => { return prisma.orderHistory.findMany({ where: { userId } }) }
    
}