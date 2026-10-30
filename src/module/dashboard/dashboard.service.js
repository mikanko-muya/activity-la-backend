import { dashboardRepository } from "./dashboard.repository.js";

// Laos has one time zone and no daylight saving, so "a day" is a fixed offset
// from UTC. Days are counted in Vientiane time: a sale at 01:00 local belongs to
// that morning, not to the previous UTC day.
export const TIME_ZONE = "Asia/Vientiane";
const LOCAL_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const TOP_EVENTS = 5;
const UPCOMING_EVENTS = 5;
const RECENT_ORDERS = 6;

const localDayKey = (date) => new Date(date.getTime() + LOCAL_OFFSET_MS).toISOString().slice(0, 10);

const startOfLocalDay = (date) => {
    const local = date.getTime() + LOCAL_OFFSET_MS;
    return new Date(local - (local % DAY_MS) - LOCAL_OFFSET_MS);
};

// Kip has no subunit, but the column is Decimal(10,2): round so that adding
// many amounts never surfaces as 1999.9999999.
const money = (value) => Math.round(value * 100) / 100;

const ticketsIn = (sale) => sale.order.orderItems.reduce((sum, item) => sum + item.quantity, 0);

const summarize = (sales) => ({
    revenue: money(sales.reduce((sum, sale) => sum + Number(sale.amount), 0)),
    orders: sales.length,
    tickets: sales.reduce((sum, sale) => sum + ticketsIn(sale), 0),
});

const dailySeries = (sales, from, days) => {
    const byDay = new Map();
    for (let i = 0; i < days; i++) {
        const date = localDayKey(new Date(from.getTime() + i * DAY_MS));
        byDay.set(date, { date, revenue: 0, orders: 0, tickets: 0 });
    }
    for (const sale of sales) {
        const day = byDay.get(localDayKey(sale.paidAt));
        if (!day) continue;
        day.revenue = money(day.revenue + Number(sale.amount));
        day.orders += 1;
        day.tickets += ticketsIn(sale);
    }
    return [...byDay.values()];
};

const topEvents = async (sales) => {
    const byEvent = new Map();
    for (const sale of sales) {
        const entry = byEvent.get(sale.order.eventId) ?? { id: sale.order.eventId, revenue: 0, orders: 0, tickets: 0 };
        entry.revenue = money(entry.revenue + Number(sale.amount));
        entry.orders += 1;
        entry.tickets += ticketsIn(sale);
        byEvent.set(entry.id, entry);
    }

    const top = [...byEvent.values()]
        .sort((a, b) => b.revenue - a.revenue || b.tickets - a.tickets)
        .slice(0, TOP_EVENTS);
    if (top.length === 0) return [];

    const titles = new Map(
        (await dashboardRepository.findEventTitles(top.map((e) => e.id))).map((e) => [e.id, e.title])
    );
    return top.map((e) => ({ ...e, title: titles.get(e.id) ?? "Deleted event" }));
};

export const dashboardService = {
    // The current period is the last `days` local days, today included and up
    // to now. The previous period is the same length ending `days` days ago, so
    // a comparison made at 10:00 sets ten hours of today against ten hours of
    // that day rather than against a whole one.
    async getDashboard({ days }) {
        const now = new Date();
        const from = new Date(startOfLocalDay(now).getTime() - (days - 1) * DAY_MS);
        const previousFrom = new Date(from.getTime() - days * DAY_MS);
        const previousTo = new Date(now.getTime() - days * DAY_MS);

        const [sales, customers, previousCustomers, upcoming, recentOrders, expiredPending] = await Promise.all([
            dashboardRepository.findSales({ from: previousFrom, to: now }),
            dashboardRepository.countNewCustomers({ from, to: now }),
            dashboardRepository.countNewCustomers({ from: previousFrom, to: previousTo }),
            dashboardRepository.findUpcomingEvents({ now, take: UPCOMING_EVENTS }),
            dashboardRepository.findRecentOrders({ take: RECENT_ORDERS }),
            dashboardRepository.findExpiredPending({ now }),
        ]);

        const current = sales.filter((sale) => sale.paidAt >= from);
        const previous = sales.filter((sale) => sale.paidAt < previousTo);
        const totals = summarize(current);
        const previousTotals = summarize(previous);

        return {
            period: { days, from, to: now, timeZone: TIME_ZONE },
            totals: {
                revenue: { current: totals.revenue, previous: previousTotals.revenue },
                orders: { current: totals.orders, previous: previousTotals.orders },
                tickets: { current: totals.tickets, previous: previousTotals.tickets },
                newCustomers: { current: customers, previous: previousCustomers },
            },
            daily: dailySeries(current, from, days),
            topEvents: await topEvents(current),
            upcomingEvents: upcoming.map(({ ticketTypes, venue, ...event }) => ({
                ...event,
                venueName: venue?.name ?? null,
                capacity: ticketTypes.reduce((sum, t) => sum + t.quantity, 0),
                taken: ticketTypes.reduce((sum, t) => sum + t.saleQuantity, 0),
            })),
            recentOrders,
            attention: {
                expiredPendingOrders: expiredPending.length,
                heldSeats: expiredPending.reduce(
                    (sum, order) => sum + order.orderItems.reduce((s, item) => s + item.quantity, 0),
                    0
                ),
            },
        };
    },
};
