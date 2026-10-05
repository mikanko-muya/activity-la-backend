import { UserRole } from "@prisma/client";

export const Permissions = {
    user: {
        create: "user:create",
        read: "user:read",
        update: "user:update",
        delete: "user:delete",
        assignRole: "user:assign-role",
    },
    event: {
        create: "event:create",
        update: "event:update",
        delete: "event:delete",
        publish: "event:publish",
    },
    category: {
        create: "category:create",
        update: "category:update",
        delete: "category:delete",
    },
    order: {
        read: "order:read",
        cancel: "order:cancel",
        delete: "order:delete",
    },
    venue: {
        create: "venue:create",
        update: "venue:update",
        delete: "venue:delete",
    },
    coupon: {
        create: "coupon:create",
        read: "coupon:read",
        update: "coupon:update",
        delete: "coupon:delete",
    },
    organizer: {
        create : "organizer:create",
        read : "organizer:read",
        update : "organizer:update",
        delete : "organizer:delete"
    },
    notification: {
        create: "notification:create",
        read: "notification:read",
        update: "notification:update",
        delete: "notification:delete",
    },
};

const flatten = (group) => Object.values(group).flatMap((actions) => Object.values(actions));

const CONTENT_PERMISSIONS = flatten({
    event: Permissions.event,
    category: Permissions.category,
    coupon: Permissions.coupon,
    order: Permissions.order,
    venue: Permissions.venue,
    organizer: Permissions.organizer,
    notification: Permissions.notification,
});

const ALL_PERMISSIONS = flatten(Permissions);

export const RolePermissions = {
    [UserRole.USER]: [],
    [UserRole.ADMIN]: CONTENT_PERMISSIONS,
    [UserRole.SUPERADMIN]: ALL_PERMISSIONS,
};

export const hasPermission = (role, permission) =>
    (RolePermissions[role] ?? []).includes(permission);
