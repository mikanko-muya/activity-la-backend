import { z } from "zod";

export const DASHBOARD_PERIODS = ["7", "30", "90"];

export const getDashboardSchema = z.object({
    days: z.enum(DASHBOARD_PERIODS).default("30").transform(Number),
});
