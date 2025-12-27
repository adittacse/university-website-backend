const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
    try {
        // ================= PAGINATION =================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // ================= FILTERS =================
        const filter = {};

        if (req.query.action) {
            filter.action = req.query.action;
        }

        if (req.query.admin) {
            filter.admin = req.query.admin;
        }

        if (req.query.targetType) {
            filter.targetType = req.query.targetType;
        }

        // ================= DATE RANGE =================
        if (req.query.from || req.query.to) {
            filter.createdAt = {};

            if (req.query.from) {
                filter.createdAt.$gte = new Date(req.query.from);
            }

            if (req.query.to) {
                filter.createdAt.$lte = new Date(req.query.to);
            }
        }

        // ================= QUERY =================
        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate("admin", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            AuditLog.countDocuments(filter),
        ]);

        // ================= RESPONSE =================
        res.json({
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAuditLogs };
