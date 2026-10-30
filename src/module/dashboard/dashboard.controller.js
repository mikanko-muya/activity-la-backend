import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { dashboardService } from "./dashboard.service.js";
import { getDashboardSchema } from "./dashboard.schema.js";

const router = Router();

router.get(
    "/",
    requirePermission(Permissions.dashboard.read),
    validate(getDashboardSchema, "query"),
    asyncHandler(async (req, res) => {
        const data = await dashboardService.getDashboard(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Dashboard fetched successfully",
            data,
        });
    })
);

export default router;
