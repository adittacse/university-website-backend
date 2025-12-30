const Notice = require("../models/Notice");
const User = require("../models/User");
const { getBDDateRange } = require("../utils/date.helper");

// Format date as YYYY-MM-DD (BD)
const formatBDDate = (date) => {
    return date.toLocaleDateString("en-CA", {
        timeZone: "Asia/Dhaka",
    });
};

/**
 * ===========================
 * ADMIN DASHBOARD
 * ===========================
 * GET /api/admin/dashboard
 */
const adminDashboard = async (req, res) => {
    const days = [7, 15, 30].includes(Number(req.query.days))
        ? Number(req.query.days)
        : 7;

    try {
        /* ===============================
         * BASIC COUNTS (MANDATORY)
         * =============================== */
        const [totalUsers, totalNotices, activeNotices, deletedNotices] =
            await Promise.all([
                User.countDocuments(),
                Notice.countDocuments(),
                Notice.countDocuments({ isDeleted: false }),
                Notice.countDocuments({ isDeleted: true }),
            ]);

        /* =================================================
         * TOTAL DOWNLOADS & TOTAL VIEWS
         * ================================================= */
        const [totalDownloadsAgg, totalViewsAgg] = await Promise.all([
            Notice.aggregate([
                { $match: { isDeleted: false } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$downloadCount" },
                    },
                },
            ]),
            Notice.aggregate([
                { $match: { isDeleted: false } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$viewCount" },
                    },
                },
            ]),
        ]);

        const totalDownloads = totalDownloadsAgg[0]?.total || 0;
        const totalViews = totalViewsAgg[0]?.total || 0;

        /* ===============================
         * MOST DOWNLOADED NOTICE
         * =============================== */
        const mostDownloadedNotice = await Notice.findOne({ isDeleted: false })
            .sort({ downloadCount: -1 })
            .select("title downloadCount");
        
        const mostViewedNotice = await Notice.findOne({ isDeleted: false })
            .sort({ viewCount: -1 })
            .select("title viewCount");

        /* =================================================
         * ANALYTICS (UNCHANGED – PERFECT)
         * ================================================= */
        const { start, end } = getBDDateRange(days);

        const notices = await Notice.find({
            createdAt: { $lte: end },
        }).select("createdAt downloadCount viewCount");

        const analyticsMap = {};

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = formatBDDate(d);
            analyticsMap[key] = {
                date: key,
                totalNotices: 0,
                totalDownloads: 0,
                totalViews: 0,
            };
        }

        notices.forEach((notice) => {
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const key = formatBDDate(d);
                const dayEnd = new Date(`${key}T23:59:59`);

                if (notice.createdAt <= dayEnd) {
                    analyticsMap[key].totalNotices += 1;
                    analyticsMap[key].totalDownloads += notice.downloadCount || 0;
                    analyticsMap[key].totalViews += notice.viewCount || 0;
                }
            }
        });

        const analytics = Object.values(analyticsMap);

        /* ===============================
         * FINAL RESPONSE
         * =============================== */
        res.status(200).json({
            success: true,
            days,
            stats: {
                totalUsers,
                totalNotices,
                activeNotices,
                deletedNotices,
                totalDownloads,
                totalViews,
            },

            mostDownloadedNotice: mostDownloadedNotice
                ? {
                      title: mostDownloadedNotice.title,
                      downloads: mostDownloadedNotice.downloadCount,
                  }
                : null,

            mostViewedNotice: mostViewedNotice
                ? {
                      title: mostViewedNotice.title,
                      views: mostViewedNotice.viewCount,
                  }
                : null,

            analytics,
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load admin dashboard",
        });
    }
};

module.exports = { adminDashboard };