const Notice = require("../models/Notice");
const User = require("../models/User");
const Role = require("../models/Role");
const path = require("path");
const fs = require("fs");
const logAudit = require("../utils/auditLogger");
const mongoose = require("mongoose");

// helper: safely convert string → array
const parseArray = (value) => {
    if (!value) {
        return [];
    }

    // already array
    if (Array.isArray(value)) {
        return value;
    }

    // JSON string array
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (err) {
        // fallback: comma separated
        return value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
    }

    return [];
};

// ================= CREATE NOTICE =================
const createNotice = async (req, res) => {
    try {
        const { title, description, categories, allowedRoles } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "File is required" });
        }

        // ----------- categories parsing ----------
        const categoryIds = parseArray(categories);

        // ----------- allowedRoles parsing ----------
        const roleNames = parseArray(allowedRoles);

        // 🔥 convert role names → Role ObjectIds
        let roleIds = [];
        if (roleNames.length > 0) {
            const roles = await Role.find({ name: { $in: roleNames } });
            roleIds = roles.map((r) => r._id);
        }

        const notice = await Notice.create({
            title,
            description,
            categories: categoryIds,
            allowedRoles: roleIds,
            file: {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size,
            },
            createdBy: req.user.id,
        });

        res.status(201).json(notice);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create notice",
            error: error.message,
        });
    }
};

// ================= GET ALL NOTICES =================
const getNotices = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("role");

        // ================= QUERY PARAMS =================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const category = req.query.category || null;

        const skip = (page - 1) * limit;

        // ================= BASE FILTER =================
        const isDeleted =
            req.query.isDeleted === "true"
                ? true
                : req.query.isDeleted === "false"
                ? false
                : undefined;

        let filter = {};

        if (isDeleted !== undefined) {
            filter.isDeleted = isDeleted;
        }

        // 🔍 search by title
        if (search) {
            filter.title = { $regex: search, $options: "i" };
        }

        // 🗂️ category filter
        if (category) {
            filter.categories = category;
        }

        // 🔐 role filter (non-admin)
        if (user.role.name !== "admin") {
            filter.$or = [
                { allowedRoles: { $size: 0 } }, // public notice
                { allowedRoles: user.role._id },
            ];
        }

        // ================= QUERY =================
        const [notices, total] = await Promise.all([
            Notice.find(filter)
                .populate("categories", "name")
                .populate("allowedRoles", "name")
                .populate("createdBy", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Notice.countDocuments(filter),
        ]);

        // ================= RESPONSE =================
        res.json({
            data: notices,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= GET SINGLE NOTICE =================
const getNoticeById = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id)
            .populate("categories", "name")
            .populate("allowedRoles", "name")
            .populate("createdBy", "name email");

        if (notice.isDeleted) {
            return res.status(404).json({ message: "Notice not found" });
        }

        const user = await User.findById(req.user.id).populate("role");

        if (
            notice.allowedRoles.length > 0 &&
            user.role.name !== "admin" &&
            !notice.allowedRoles.some(
                (role) => role._id.toString() === user.role._id.toString(),
            )
        ) {
            return res.status(403).json({ message: "Access denied" });
        }

        // 👁️ VIEW COUNT INCREMENT
        notice.viewCount += 1;
        await notice.save();

        res.json(notice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= DOWNLOAD NOTICE =================
const downloadNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (notice.isDeleted) {
            return res.status(404).json({ message: "Notice not found" });
        }

        const allowedRoles = notice.allowedRoles || [];

        const user = await User.findById(req.user.id).populate("role");

        if (
            allowedRoles.length > 0 &&
            user.role.name !== "admin" &&
            !allowedRoles.some(
                (role) => role.toString() === user.role._id.toString(),
            )
        ) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!notice.file?.path || !fs.existsSync(notice.file.path)) {
            return res.status(404).json({ message: "File not found" });
        }

        notice.downloadCount += 1;
        await notice.save();

        res.download(notice.file.path, notice.file.filename);
    } catch (error) {
        res.status(500).json({
            message: "Failed to download notice",
            error: error.message,
        });
    }
};

// ================= UPDATE NOTICE =================
const updateNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({ message: "Notice not found" });
        }

        const { title, description, categories, allowedRoles } = req.body;

        if (title) {
            notice.title = title;
        }
        if (description) {
            notice.description = description;
        }
        if (categories) {
            notice.categories = parseArray(categories);
        }
        if (allowedRoles) {
            notice.allowedRoles = parseArray(allowedRoles);
        }

        // ================= FILE UPDATE =================
        if (req.file) {
            const archiveDir = path.resolve("uploads/notice/archive");

            if (!fs.existsSync(archiveDir)) {
                fs.mkdirSync(archiveDir, { recursive: true });
            }

            // move old file to archive
            if (notice.file?.path) {
                const oldAbsolutePath = path.resolve(notice.file.path);

                if (fs.existsSync(oldAbsolutePath)) {
                    const fileName = path.basename(oldAbsolutePath);
                    const newAbsolutePath = path.join(archiveDir, fileName);

                    fs.renameSync(oldAbsolutePath, newAbsolutePath);
                }
            }

            // save new file
            notice.file = {
                filename: req.file.filename,
                path: req.file.path, // multer already gives correct relative path
                mimetype: req.file.mimetype,
                size: req.file.size,
            };
        }

        await notice.save();

        await logAudit({
            adminId: req.user.id,
            action: "NOTICE_UPDATE",
            targetType: "Notice",
            targetId: notice._id,
        });

        res.json({
            message: "Notice updated successfully",
            notice,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update notice",
            error: error.message,
        });
    }
};

// ================= DELETE NOTICE =================
const deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({ message: "Notice not found" });
        }

        notice.isDeleted = true;
        notice.deletedAt = new Date();

        await notice.save();

        // 🧾 AUDIT LOG
        await logAudit({
            adminId: req.user.id,
            action: "NOTICE_DELETE",
            targetType: "Notice",
            targetId: notice._id,
            meta: {
                title: notice.title,
            },
        });

        res.json({ message: "Notice deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete notice",
            error: error.message,
        });
    }
};

// ================= RESTORE NOTICE (Admin only) =================
const restoreNotices = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "ids array is required" });
        }

        const result = await Notice.updateMany(
            {
                _id: { $in: ids },
                isDeleted: true
            },
            {
                $set: {
                    isDeleted: false,
                    deletedAt: null,
                },
            },
        );

        // audit log
        for (const id of ids) {
            await logAudit({
                adminId: req.user.id,
                action: "NOTICE_RESTORE",
                targetType: "Notice",
                targetId: id,
            });
        }

        res.json({
            message: "Notice(s) restored successfully",
            restoredCount: result.modifiedCount,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to restore notice(s)",
            error: error.message,
        });
    }
};


// ================= GET DELETED NOTICES (Admin only) =================
const getDeletedNotices = async (req, res) => {
    try {
        const notices = await Notice.find({ isDeleted: true })
            .populate("categories", "name")
            .populate("allowedRoles", "name")
            .populate("createdBy", "name email")
            .sort({ deletedAt: -1 });

        res.json(notices);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch deleted notices",
            error: error.message,
        });
    }
};

const permanentDeleteNotices = async (req, res) => {
    try {
        let { ids } = req.body;

        if (!ids) {
            return res.status(400).json({ message: "Notice IDs required" });
        }

        // allow single id or array
        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        // sanitize ObjectIds
        ids = ids
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

        if (ids.length === 0) {
            return res.status(400).json({ message: "Invalid notice IDs" });
        }

        const notices = await Notice.find({
            _id: { $in: ids },
            isDeleted: true, // 🔥 only trash items
        });

        let deletedCount = 0;

        for (const notice of notices) {
            // ================= DELETE MAIN FILE =================
            if (notice.file?.path) {
                const mainPath = path.resolve(notice.file.path);
                if (fs.existsSync(mainPath)) {
                    fs.unlinkSync(mainPath);
                }
            }

            // ================= DELETE ARCHIVE FILE (if exists) =================
            if (notice.file?.filename) {
                const archivePath = path.resolve(
                    "uploads/notice/archive",
                    notice.file.filename,
                );

                if (fs.existsSync(archivePath)) {
                    fs.unlinkSync(archivePath);
                }
            }

            // ================= DELETE DB RECORD =================
            await notice.deleteOne();
            deletedCount++;

            // ================= AUDIT LOG =================
            await logAudit({
                adminId: req.user.id,
                action: "NOTICE_PERMANENT_DELETE",
                targetType: "Notice",
                targetId: notice._id,
            });
        }

        res.json({
            message: "Permanent delete completed",
            requested: ids.length,
            deleted: deletedCount,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to permanently delete notices",
            error: error.message,
        });
    }
};

const getNoticeCounts = async (req, res) => {
    const [published, trash] = await Promise.all([
        Notice.countDocuments({ isDeleted: false }),
        Notice.countDocuments({ isDeleted: true }),
    ]);

    res.json({ published, trash });
};

module.exports = {
    createNotice,
    getNotices,
    getNoticeCounts,
    getNoticeById,
    downloadNotice,
    updateNotice,
    deleteNotice,
    restoreNotices,
    getDeletedNotices,
    permanentDeleteNotices,
};
