const Notice = require("../models/Notice");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const adminDashboard = async (req, res) => {
    try {
        /* ================= METRICS ================= */
        const [
            totalNotices,
            activeNotices,
            deletedNotices,
            totalUsers,
            totalDownloadsAgg,
            totalViewsAgg,
        ] = await Promise.all([
            Notice.countDocuments(),
            Notice.countDocuments({ isDeleted: false }),
            Notice.countDocuments({ isDeleted: true }),
            User.countDocuments(),

            // ✅ ONLY ACTIVE NOTICE DOWNLOADS
            Notice.aggregate([
                {
                    $match: {
                        isDeleted: false
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$downloadCount"
                        },
                    },
                },
            ]),

            // ✅ ONLY ACTIVE NOTICE VIEWS
            Notice.aggregate([
                {
                    $match: {
                        isDeleted: false
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$viewCount"
                        },
                    },
                },
            ]),
        ]);

        /* ================= STATS ================= */
        const [mostDownloaded, mostViewed] = await Promise.all([
            Notice.findOne({ isDeleted: false })
                .sort({ downloadCount: -1 })
                .select("title downloadCount"),

            Notice.findOne({ isDeleted: false })
                .sort({ viewCount: -1 })
                .select("title viewCount"),
        ]);

        /* ================= ANALYTICS ================= */
        const last7DaysDownloads = await AuditLog.aggregate([
            {
                $match: {
                    action: "NOTICE_DOWNLOAD",
                    createdAt: {
                        $gte: new Date(Date.now() - 7 * 86400000),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 }
            },
        ]);

        res.json({
            metrics: {
                notices: {
                    total: totalNotices,
                    active: activeNotices,
                    deleted: deletedNotices,
                },
                files: {
                    totalDownloads: totalDownloadsAgg[0]?.total || 0,
                    totalViews: totalViewsAgg[0]?.total || 0,
                },
                users: {
                    total: totalUsers,
                },
            },

            stats: {
                mostDownloadedNotice: mostDownloaded,
                mostViewedNotice: mostViewed,
            },

            analytics: {
                downloadsLast7Days: last7DaysDownloads.map((d) => ({
                    date: d._id,
                    count: d.count,
                })),
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to load admin dashboard",
            error: error.message,
        });
    }
};

module.exports = { adminDashboard };
