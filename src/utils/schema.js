import { z } from "zod";

// Query strings and multipart form fields are always text, so "true"/"false"
// has to become a real boolean before Prisma sees it. z.coerce.boolean() is no
// use here - it follows JS truthiness, so the string "false" would come out
// true. Shared by the user and event DTOs.
export const booleanFromText = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true");
