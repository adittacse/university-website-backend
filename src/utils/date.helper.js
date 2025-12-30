/**
 * ===========================
 * Bangladesh Date Utilities
 * ===========================
 */

// Last N days range in Bangladesh timezone
const getBDDateRange = (days = 7) => {
    const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    return { start, end };
};

module.exports = { getBDDateRange };
