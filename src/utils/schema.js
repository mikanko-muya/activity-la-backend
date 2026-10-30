import { z } from "zod";

export const booleanFromText = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true");

// An optional translated field (a description) is written in both languages or
// in neither, so one language never shows text the other lacks. An update is
// checked only when it sends both halves, since it cannot see the stored one.
export const pairedTranslation = (field, { partial = false } = {}) => (data, ctx) => {
  const english = `${field}En`;
  if (partial && !(field in data && english in data)) return;

  const hasLao = Boolean(data[field]);
  const hasEnglish = Boolean(data[english]);
  if (hasLao === hasEnglish) return;

  ctx.addIssue({
    code: "custom",
    path: [hasLao ? english : field],
    message: hasLao ? `Add the English ${field} too` : `Add the Lao ${field} too`,
  });
};
