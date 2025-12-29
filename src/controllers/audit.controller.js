const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

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

        if (req.query.admin && mongoose.Types.ObjectId.isValid(req.query.admin)) {
            filter.admin = req.query.admin;
        }

        if (req.query.targetType) {
            filter.targetType = req.query.targetType;
        }

        // ================= DATE RANGE =================
        if (req.query.from || req.query.to) {
            filter.createdAt = {};

            if (req.query.from) {
                const fromDate = new Date(req.query.from);
                fromDate.setHours(0, 0, 0, 0);
                if (!isNaN(fromDate)) {
                    filter.createdAt.$gte = fromDate;
                }
            }

            if (req.query.to) {
                const toDate = new Date(req.query.to);
                toDate.setHours(23, 59, 59, 999);
                if (!isNaN(toDate)) {
                    filter.createdAt.$lte = toDate;
                }
            }
        }

        // ================= QUERY =================
        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate("admin", "name email")
                .populate({
                    path: "targetId",
                    select: "title name",
                    strictPopulate: false,
                })
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
