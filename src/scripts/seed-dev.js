import dotenv from "dotenv";

import { prisma } from "../config/prisma.config.js";
import { hashPassword } from "../utils/password.js";
import { orderService } from "../module/order/order.service.js";
import { paymentService } from "../module/payment/payment.service.js";
import { notificationService } from "../module/notification/notification.service.js";
import { explainDbError } from "./explainDbError.js";

dotenv.config();

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "db"];

const refuseUnlessLocal = () => {
    if (process.env.NODE_ENV === "production") {
        throw new Error("seed:dev refuses to run with NODE_ENV=production");
    }

    const host = new URL(process.env.DATABASE_URL).hostname;
    if (!LOCAL_HOSTS.includes(host) && process.env.SEED_ALLOW_REMOTE !== "1") {
        throw new Error(
            `seed:dev wipes data and only runs against a local database, not "${host}". ` +
            "Set SEED_ALLOW_REMOTE=1 if you really mean it."
        );
    }
};

const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const image = (seed, w = 800, h = 450) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const ADMIN_PASSWORD = "Admin1234!";
const CUSTOMER_PASSWORD = "Customer123!";

const CATEGORY_NAMES = [
    "Concert", "Festival", "Sports", "Workshop", "Exhibition", "Conference", "Theatre",
    "Comedy", "Food & Drink", "Market", "Charity", "Film", "Nightlife", "Family",
    "Wellness", "Technology", "Education", "Art", "Dance", "Music Class", "Gaming",
    "Fashion", "Photography", "Travel", "Culture",
];

const ORGANIZERS = [
    { name: "Mekong Live", email: "hello@mekonglive.seed", phone: "0205550101", description: "Concerts and festivals along the river." },
    { name: "Vientiane Events Co", email: "team@vteevents.seed", phone: "0205550102", description: "City events, markets and night life." },
    { name: "Lao Makers Club", email: "club@laomakers.seed", phone: "0205550103", description: "Workshops and classes for people who make things." },
    { name: "Heritage Lao Tours", email: "info@heritagelao.seed", phone: "0205550104", description: "Walking tours and cultural experiences." },
    { name: "Tech Laos", email: "community@techlaos.seed", phone: "0205550105", description: "Meetups and conferences for the tech community." },
    { name: "Good Cause Laos", email: "give@goodcause.seed", phone: "0205550106", description: "Charity runs and fundraisers." },
];

const VENUES = [
    { name: "National Cultural Hall", province: "Vientiane", address: "Samsenthai Road" },
    { name: "Chao Anouvong Park", province: "Vientiane", address: "Fa Ngum Road, riverside" },
    { name: "Luang Prabang Night Market", province: "Luang Prabang", address: "Sisavangvong Road" },
    { name: "Pakse Riverside Square", province: "Champasak", address: "Route 13, Pakse" },
    { name: "Vang Vieng Lagoon Stage", province: "Vientiane Province", address: "Blue Lagoon 1" },
    { name: "ITECC Convention Centre", province: "Vientiane", address: "Kaysone Phomvihane Avenue" },
];

const CUSTOMERS = [
    { name: "Noy Phommachanh", key: "noy" },
    { name: "Kham Sisouk", key: "kham" },
    { name: "Somchai Keola", key: "somchai" },
    { name: "Vanh Inthavong", key: "vanh" },
    { name: "Malee Douangdy", key: "malee" },
    { name: "Bounmy Rattana", key: "bounmy" },
    { name: "Phet Sayavong", key: "phet" },
    { name: "Dara Vongsa", key: "dara" },
];

// Days since each customer signed up.
const CUSTOMER_AGE_DAYS = { noy: 110, kham: 95, somchai: 70, vanh: 50, malee: 34, bounmy: 20, phet: 9, dara: 3 };

// Past sales, as [days ago, customer, event, ticket type, quantity, method], so
// the dashboard has a history to chart and an earlier period to compare with.
// Each sits inside its customer's age and within the ticket type's stock.
const SALE_HISTORY = [
    [3, "phet", "market", "entry", 3, "onepay"],
    [6, "bounmy", "comedy", "general", 2, "bcel_one"],
    [7, "noy", "rock", "general", 2, "onepay"],
    [8, "somchai", "run", "5k", 1, "onepay"],
    [10, "kham", "film", "ticket", 2, "bcel_one"],
    [11, "vanh", "sunset", "general", 3, "onepay"],
    [12, "bounmy", "heritage", "general", 2, "bank_transfer"],
    [14, "noy", "photo", "seat", 1, "onepay"],
    [15, "somchai", "sunset", "vip", 1, "bcel_one"],
    [18, "kham", "rock", "general", 4, "onepay"],
    [19, "malee", "coffee", "seat", 2, "onepay"],
    [20, "vanh", "market", "entry", 5, "bcel_one"],
    [24, "noy", "comedy", "general", 1, "onepay"],
    [26, "somchai", "rock", "general", 2, "bank_transfer"],
    [29, "kham", "sunset", "general", 2, "onepay"],
    [33, "malee", "run", "10k", 2, "bcel_one"],
    [36, "noy", "rock", "general", 3, "onepay"],
    [41, "vanh", "sunset", "general", 2, "onepay"],
    [45, "somchai", "comedy", "general", 2, "bcel_one"],
    [52, "kham", "heritage", "general", 2, "onepay"],
    [58, "noy", "film", "ticket", 4, "bank_transfer"],
    [64, "kham", "rock", "general", 2, "onepay"],
    [77, "kham", "sunset", "general", 4, "bcel_one"],
    [88, "noy", "market", "entry", 6, "onepay"],
    [104, "noy", "rock", "general", 1, "onepay"],
];

const wipe = async () => {
    const superadmins = await prisma.user.findMany({
        where: { role: "SUPERADMIN" },
        select: { id: true },
    });
    const keep = superadmins.map((u) => u.id);

    await prisma.$transaction([
        prisma.notification.deleteMany(),
        prisma.tickets.deleteMany(),
        prisma.orderItem.deleteMany(),
        prisma.payment.deleteMany(),
        prisma.couponRedemption.deleteMany(),
        prisma.orderHistory.deleteMany(),
        prisma.order.deleteMany(),
        prisma.coupon.deleteMany(),
        prisma.ticketType.deleteMany(),
        prisma.eventBanner.deleteMany(),
        prisma.event.deleteMany(),
        prisma.organizer.deleteMany(),
        prisma.venue.deleteMany(),
        prisma.category.deleteMany(),
        prisma.user.deleteMany({ where: { id: { notIn: keep } } }),
    ]);

    return keep.length;
};

const seedUsers = async () => {
    const adminHash = await hashPassword(ADMIN_PASSWORD);
    const customerHash = await hashPassword(CUSTOMER_PASSWORD);

    const admin = await prisma.user.create({
        data: {
            name: "Admin Seed",
            email: "admin@seed.activity.la",
            phone: "0201000001",
            password: adminHash,
            role: "ADMIN",
            createdAt: days(-150),
        },
    });

    // Sign-ups spread over months, so the dashboard's new-customer count has a
    // previous period to compare against. Nobody buys before they joined:
    // SALE_HISTORY below stays inside each customer's age.
    const customers = {};
    let n = 1;
    for (const c of CUSTOMERS) {
        customers[c.key] = await prisma.user.create({
            data: {
                name: c.name,
                email: `${c.key}@seed.activity.la`,
                phone: `020200000${n++}`,
                password: customerHash,
                profileUrl: image(`user-${c.key}`, 200, 200),
                createdAt: days(-CUSTOMER_AGE_DAYS[c.key]),
            },
        });
    }

    await prisma.user.create({
        data: {
            name: "Lattana Inactive",
            email: "lattana@seed.activity.la",
            phone: "0202000099",
            password: customerHash,
            isActive: false,
            createdAt: days(-60),
        },
    });

    return { admin, customers };
};

const seedCatalog = async () => {
    const categories = {};
    for (const name of CATEGORY_NAMES) {
        const slug = name.toLowerCase().replace(/[^a-z]+/g, "-");
        categories[name] = await prisma.category.create({
            data: { name, iconUrl: image(`cat-${slug}`, 96, 96) },
        });
    }

    const organizers = [];
    for (const [i, o] of ORGANIZERS.entries()) {
        organizers.push(
            await prisma.organizer.create({ data: { ...o, logoUrl: image(`org-${i}`, 160, 160) } })
        );
    }

    const venues = [];
    for (const v of VENUES) {
        venues.push(
            await prisma.venue.create({
                data: { ...v, mapUrl: `https://maps.google.com/?q=${encodeURIComponent(v.name)}` },
            })
        );
    }

    return { categories, organizers, venues };
};

// Every event starts PUBLISHED so the order service will sell tickets for it;
// the ones meant to end up DRAFT or CANCELLED are moved there after sales.
const EVENTS = [
    { key: "sunset", title: "Mekong Sunset Festival", category: "Festival", org: 0, venue: 1, in: 12, hours: 6, status: "PUBLISHED",
      types: [
          { key: "early", name: "Early Bird", price: 100000, quantity: 200, saleStart: days(-30), saleEnd: days(-2) },
          { key: "general", name: "General", price: 150000, quantity: 500 },
          { key: "vip", name: "VIP", price: 450000, quantity: 50 },
      ] },
    { key: "rock", title: "Vientiane Rock Night", category: "Concert", org: 0, venue: 0, in: 20, hours: 4, status: "PUBLISHED",
      types: [
          { key: "general", name: "General", price: 200000, quantity: 300 },
          { key: "vip", name: "VIP Front Row", price: 600000, quantity: 3 },
      ] },
    { key: "heritage", title: "Luang Prabang Heritage Walk", category: "Travel", org: 3, venue: 2, in: 8, hours: 3, status: "PUBLISHED",
      types: [{ key: "general", name: "Walker", price: 80000, quantity: 40 }] },
    // "Sandbox Test" costs 1 kip because the PhaJay test account only takes
    // 1-999 kip - it is the ticket to buy when checking a real QR payment.
    { key: "coffee", title: "Lao Coffee Workshop", category: "Workshop", org: 2, venue: 0, in: 5, hours: 2, status: "PUBLISHED",
      types: [
          { key: "seat", name: "Seat", price: 120000, quantity: 20 },
          { key: "sandbox", name: "Sandbox Test (1 kip)", price: 1, quantity: 100 },
      ] },
    { key: "tech", title: "Tech Meetup Vientiane", category: "Technology", org: 4, venue: 5, in: 15, hours: 3, status: "PUBLISHED", isFree: true,
      types: [{ key: "free", name: "Free Pass", price: 0, quantity: 100 }] },
    { key: "market", title: "Pakse Food Market", category: "Food & Drink", org: 1, venue: 3, in: 3, hours: 5, status: "PUBLISHED",
      types: [{ key: "entry", name: "Entry", price: 20000, quantity: 1000 }] },
    { key: "comedy", title: "Stand-up Comedy Night", category: "Comedy", org: 1, venue: 0, in: 25, hours: 2, status: "PUBLISHED",
      types: [
          { key: "general", name: "General", price: 100000, quantity: 120 },
          { key: "balcony", name: "Balcony", price: 80000, quantity: 40, status: "INACTIVE" },
      ] },
    { key: "run", title: "Charity Fun Run", category: "Charity", org: 5, venue: 1, in: 30, hours: 4, status: "PUBLISHED",
      types: [
          { key: "5k", name: "5K", price: 50000, quantity: 400 },
          { key: "10k", name: "10K", price: 70000, quantity: 300 },
      ] },
    { key: "photo", title: "Photography Masterclass", category: "Photography", org: 2, venue: 5, in: 40, hours: 6, status: "PUBLISHED",
      types: [{ key: "seat", name: "Seat", price: 250000, quantity: 15 }] },
    { key: "film", title: "Indie Film Screening", category: "Film", org: 1, venue: 0, in: 10, hours: 2, status: "PUBLISHED",
      types: [{ key: "ticket", name: "Ticket", price: 60000, quantity: 80 }] },
    { key: "countdown", title: "New Year Countdown", category: "Nightlife", org: 0, venue: 1, in: 80, hours: 5, status: "DRAFT",
      types: [{ key: "general", name: "General", price: 150000, quantity: 1000 }] },
    { key: "art", title: "Art Exhibition Opening", category: "Art", org: 2, venue: 2, in: 45, hours: 3, status: "DRAFT", isFree: true,
      types: [{ key: "entry", name: "Entry", price: 0, quantity: 200 }] },
    { key: "boat", title: "Boat Racing Viewing Deck", category: "Sports", org: 3, venue: 1, in: 60, hours: 8, status: "DRAFT",
      types: [{ key: "deck", name: "Deck", price: 300000, quantity: 60 }] },
    { key: "jazz", title: "Jazz by the River", category: "Concert", org: 0, venue: 4, in: 18, hours: 3, status: "CANCELLED",
      types: [{ key: "general", name: "General", price: 180000, quantity: 200 }] },
    { key: "retreat", title: "Spring Wellness Retreat", category: "Wellness", org: 3, venue: 4, in: 35, hours: 48, status: "CANCELLED",
      types: [{ key: "pass", name: "Weekend Pass", price: 500000, quantity: 30 }] },
];

const seedEvents = async ({ categories, organizers, venues }) => {
    const events = {};

    for (const e of EVENTS) {
        const startAt = days(e.in);
        const event = await prisma.event.create({
            data: {
                title: e.title,
                description: `${e.title} - seeded for local development. ` +
                    "Long enough to check how the admin table and the public page handle a real paragraph of text.",
                coverImgUrl: image(`event-${e.key}`),
                startAt,
                endAt: new Date(startAt.getTime() + e.hours * 60 * 60 * 1000),
                isFree: Boolean(e.isFree),
                eventStatus: "PUBLISHED",
                organizerId: organizers[e.org].id,
                venueId: venues[e.venue].id,
                categoryId: categories[e.category].id,
                createdAt: days(-120),
            },
        });

        const types = {};
        for (const t of e.types) {
            types[t.key] = await prisma.ticketType.create({
                data: {
                    eventId: event.id,
                    name: t.name,
                    price: t.price,
                    quantity: t.quantity,
                    saleStart: t.saleStart ?? null,
                    saleEnd: t.saleEnd ?? null,
                    status: t.status ?? "ACTIVE",
                },
            });
        }

        events[e.key] = { ...event, finalStatus: e.status, types };
    }

    return events;
};

const seedCoupons = async (events) => {
    const make = (code, eventKey, data) =>
        prisma.coupon.create({
            data: {
                code,
                eventId: events[eventKey].id,
                validFrom: days(-7),
                validTo: days(30),
                ...data,
            },
        });

    return {
        sunset: await make("SUNSET20", "sunset", { discountType: "PERCENTAGE", discountValue: 20 }),
        rock: await make("ROCK50K", "rock", { discountType: "FIXED", discountValue: 50000 }),
        expired: await make("EARLYBIRD10", "sunset", {
            discountType: "PERCENTAGE", discountValue: 10, validFrom: days(-40), validTo: days(-1),
        }),
        inactive: await make("COMEDYOFF", "comedy", {
            discountType: "PERCENTAGE", discountValue: 15, isActive: false,
        }),
        single: await make("FIRSTONE", "market", {
            discountType: "FIXED", discountValue: 30000, usageLimit: 1,
        }),
    };
};

// Orders and payments go through the real services, so stock, coupon usage,
// tickets and notifications end up exactly as the app would leave them.
const seedOrders = async (events, customers) => {
    const counts = { paid: 0, pending: 0, cancelled: 0, expired: 0, failedPayment: 0, openPayment: 0 };

    const order = (customer, eventKey, typeKey, quantity, couponCode) =>
        orderService.createOrder(customers[customer].id, {
            eventId: events[eventKey].id,
            ticketTypeId: events[eventKey].types[typeKey].id,
            quantity,
            ...(couponCode && { couponCode }),
        });

    const pay = async (customer, created, method, status = "SUCCESS", failureReason) => {
        const payment = await paymentService.createPayment(customers[customer].id, {
            orderId: created.id,
            method,
        });
        if (status) {
            await paymentService.settlePayment({
                transactionRef: payment.transactionRef,
                status,
                ...(failureReason && { failureReason }),
            });
        }
        return payment;
    };

    // The services stamp everything with the current time; this moves a sale
    // back to when it is meant to have happened. The minutes vary so a day's
    // sales do not all share one timestamp.
    const backdate = async (orderId, daysAgo) => {
        const at = new Date(days(-daysAgo).getTime() - ((daysAgo * 37) % 600) * 60 * 1000);
        await prisma.order.update({ where: { id: orderId }, data: { createdAt: at } });
        await prisma.payment.updateMany({ where: { orderId }, data: { createdAt: at, paidAt: at } });
        await prisma.notification.updateMany({ where: { orderId }, data: { createdAt: at } });
    };

    const sale = async (daysAgo, customer, eventKey, typeKey, quantity, method, couponCode) => {
        const created = await order(customer, eventKey, typeKey, quantity, couponCode);
        await pay(customer, created, method);
        await backdate(created.id, daysAgo);
        counts.paid++;
    };

    // Coupon sales stay inside the coupons' validity, which began 7 days ago.
    await sale(1, "noy", "sunset", "general", 2, "bcel_one", "SUNSET20");
    await sale(2, "kham", "rock", "general", 1, "onepay", "ROCK50K");
    await sale(4, "somchai", "rock", "vip", 2, "onepay");
    await sale(9, "vanh", "rock", "vip", 1, "bcel_one");
    await sale(5, "malee", "market", "entry", 4, "onepay", "FIRSTONE");
    await sale(13, "kham", "jazz", "general", 2, "bank_transfer");
    // Not ldb_mobile: LDB QRs are not wired yet, and the fake refuses them too.
    await sale(17, "somchai", "comedy", "general", 2, "onepay");
    await sale(22, "malee", "photo", "seat", 1, "bank_transfer");
    await sale(27, "vanh", "run", "10k", 2, "bcel_one");

    for (const entry of SALE_HISTORY) await sale(...entry);

    await order("bounmy", "coffee", "seat", 1); counts.pending++;

    await pay("phet", await order("phet", "heritage", "general", 2), "onepay", "FAILED", "Insufficient funds");
    counts.failedPayment++; counts.pending++;

    await pay("dara", await order("dara", "sunset", "vip", 1), "bcel_one", null);
    counts.openPayment++; counts.pending++;

    const toCancel = await order("dara", "run", "5k", 1);
    await orderService.cancelOrder(toCancel.id, { actingUserId: customers.dara.id });
    counts.cancelled++;

    // No sweeper exists yet, so a reservation past its window is still PENDING.
    // That is a real state the admin has to be able to see.
    const stale = await order("noy", "film", "ticket", 3);
    await prisma.order.update({ where: { id: stale.id }, data: { expiresAt: days(-1) } });
    counts.expired++;

    return counts;
};

const settleEventStatuses = async (events) => {
    for (const e of Object.values(events)) {
        if (e.finalStatus !== "PUBLISHED") {
            await prisma.event.update({ where: { id: e.id }, data: { eventStatus: e.finalStatus } });
        }
    }
};

const seedNotifications = async (customers, coupons, events) => {
    for (const customer of Object.values(customers)) {
        await notificationService.createNotification({
            userId: customer.id,
            couponId: coupons.sunset.id,
            notifType: "PROMOTION",
            title: "20% off Mekong Sunset Festival",
            message: "Use SUNSET20 at checkout before the festival sells out.",
        });
    }

    await notificationService.createNotification({
        userId: customers.kham.id,
        eventId: events.jazz.id,
        notifType: "EVENT_REMINDER",
        title: "Jazz by the River has been cancelled",
        message: "The organizer cancelled this event. Your payment will be refunded.",
    });

    await notificationService.createNotification({
        userId: customers.bounmy.id,
        notifType: "SYSTEM",
        title: "Welcome to Activity LA",
        message: "Find events near you and keep your tickets in one place.",
    });
};

const main = async () => {
    refuseUnlessLocal();

    // Seeded payments are made up, at prices the PhaJay sandbox would refuse.
    // The fake gateway issues stand-in QRs and talks to nobody.
    process.env.PAYMENT_GATEWAY = "fake";

    console.log("seed:dev - resetting development data");
    const kept = await wipe();
    console.log(`  cleared everything except ${kept} SUPERADMIN account(s)`);

    const { customers } = await seedUsers();
    const catalog = await seedCatalog();
    const events = await seedEvents(catalog);
    const coupons = await seedCoupons(events);
    const orders = await seedOrders(events, customers);
    await settleEventStatuses(events);
    await seedNotifications(customers, coupons, events);

    const [eventCount, typeCount, orderCount, paymentCount, ticketCount, notificationCount] =
        await Promise.all([
            prisma.event.count(), prisma.ticketType.count(), prisma.order.count(),
            prisma.payment.count(), prisma.tickets.count(), prisma.notification.count(),
        ]);

    console.log(`  ${CATEGORY_NAMES.length} categories, ${ORGANIZERS.length} organizers, ${VENUES.length} venues`);
    console.log(`  ${eventCount} events (10 published, 3 draft, 2 cancelled), ${typeCount} ticket types`);
    console.log(`  5 coupons (active, fixed, expired, inactive, fully redeemed)`);
    console.log(
        `  ${orderCount} orders - ${orders.paid} paid, ${orders.pending} pending ` +
        `(${orders.failedPayment} after a failed payment, ${orders.openPayment} with a payment in flight), ` +
        `${orders.cancelled} cancelled, ${orders.expired} past its reservation`
    );
    console.log(`  ${paymentCount} payments, ${ticketCount} tickets issued, ${notificationCount} notifications`);
    console.log("  sales spread over the last 3.5 months, so the dashboard has a history");
    console.log("");
    console.log("  Sign in with:");
    console.log(`    ADMIN     0201000001 / ${ADMIN_PASSWORD}`);
    console.log(`    customer  0202000001 / ${CUSTOMER_PASSWORD}   (0202000001 - 0202000008)`);
    console.log("    SUPERADMIN unchanged - SUPERADMIN_PHONE / SUPERADMIN_PASSWORD from .env");
};

main()
    .catch((error) => {
        console.error("seed:dev failed:", explainDbError(error));
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
