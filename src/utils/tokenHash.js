import { createHash } from "node:crypto";

// Refresh tokens are stored as a digest, never in the clear. A dump of the
// table then hands out no usable sessions, for the same reason passwords are
// hashed - and the lookup still works, because the digest of a given token is
// always the same.
export const hashToken = (token) => createHash("sha256").update(String(token)).digest("hex");
