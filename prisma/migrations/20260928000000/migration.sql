-- Adds a SUPERADMIN tier above ADMIN.
--
-- ADMIN runs the platform's content - events, categories, coupons - but cannot
-- touch user accounts. That restriction is the point: until now any ADMIN could
-- PATCH /users/:id with a new role and promote themselves, so the tier would
-- have been decorative. Role assignment is SUPERADMIN-only.
--
-- Widening a MySQL ENUM is additive and does not rewrite existing rows: every
-- current USER and ADMIN keeps its value.

ALTER TABLE `User` MODIFY `role` ENUM('USER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'USER';
