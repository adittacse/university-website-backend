const axios = require("axios");
const cloudinary = require("../config/cloudinary");
const Notice = require("../models/Notice");
const User = require("../models/User");
const Role = require("../models/Role");
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
        const file = req.file;

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
                url: file.path,
                originalname: file.originalname,
                filename: file.filename,
                public_id: file.filename.includes("/")
                    ? file.filename
                    : `university/notices/${file.filename}`,
                mimetype: file.mimetype,
                size: file.size,
            },
            createdBy: req.user.id,
        });

        await logAudit({
            adminId: req.user.id,
            action: "NOTICE_CREATE",
            targetType: "Notice",
            targetId: notice._id,
            meta: {
                title: notice.title,
                allowedRoles: roleNames,
                categories: categoryIds,
            },
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
        const user = req.user
            ? await User.findById(req.user.id).populate("role")
            : null;

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

        /**
         * - Admin can see all notice
         * - Others → only isDeleted:false
         */
        if (!user || user.role.name !== "admin") {
            filter.isDeleted = false;
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
        // if (user.role.name !== "admin") {
        //     filter.$or = [
        //         { allowedRoles: { $size: 0 } }, // public notice
        //         { allowedRoles: user.role._id },
        //     ];
        // }

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

        /* ================= NOT FOUND ================= */
        if (!notice) {
            return res.status(404).json({
                message: "Notice not found",
            });
        }

        /* ================= ADMIN ACCESS ================= */
        if (req.user) {
            const adminUser = await User.findById(req.user.id).populate("role");
            if (adminUser?.role?.name === "admin") {
                notice.viewCount += 1;
                await notice.save();
                return res.json(notice);
            }
        }

        /* ================= SOFT DELETE ================= */
        if (notice.isDeleted) {
            return res.status(404).json({
                message: "Notice not found",
            });
        }

        /* ================= PUBLIC NOTICE ================= */
        if (!notice.allowedRoles || notice.allowedRoles.length === 0) {
            notice.viewCount += 1;
            await notice.save();
            return res.json(notice);
        }

        /* ================= LOGIN REQUIRED ================= */
        if (!req.user) {
            return res.status(401).json({
                message: "Login required",
                info: "This notice is restricted to specific roles",
                allowedRoles: notice.allowedRoles.map((r) => r.name),
            });
        }

        /* ================= ROLE CHECK ================= */
        const user = await User.findById(req.user.id).populate("role");

        const isAllowed = notice.allowedRoles.some(
            (role) => role._id.toString() === user.role._id.toString(),
        );

        if (!isAllowed) {
            return res.status(403).json({
                message: "Access denied",
                info: "This notice is only for specific roles",
                allowedRoles: notice.allowedRoles.map((r) => r.name),
            });
        }

        /* ================= SUCCESS ================= */
        notice.viewCount += 1;
        await notice.save();

        await AuditLog.create({
            admin: req.user?.id || null,
            action: "NOTICE_VIEW",
            targetType: "Notice",
            targetId: notice._id,
            meta: {
                title: notice.title,
            },
        });

        return res.json(notice);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to load notice",
        });
    }
};

// ================= DOWNLOAD NOTICE =================
const downloadNoticeOld = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice || notice.isDeleted) {
            return res.status(404).json({ message: "Notice not found" });
        }

        if (!notice.file?.url) {
            return res.status(404).json({ message: "File not found" });
        }

        // 🔥 increment download count
        notice.downloadCount += 1;
        await notice.save();

        // 🔥 redirect to external hosted file
        return res.redirect(notice.file.url);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to download notice",
        });
    }
};

const downloadNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice || notice.isDeleted) {
            return res.status(404).json({ message: "Notice not found" });
        }

        // 🔢 increment counter
        notice.downloadCount += 1;
        await notice.save();

        // 🧾 AUDIT LOG (THIS IS THE KEY)
        await AuditLog.create({
            admin: req.user?.id || null,
            action: "NOTICE_DOWNLOAD",
            targetType: "Notice",
            targetId: notice._id,
            meta: {
                title: notice.title,
            },
        });

        // ⬇️ stream from cloudinary
        const response = await axios.get(notice.file.url, {
            responseType: "stream",
        });

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${notice.file.originalname}"`,
        );
        res.setHeader(
            "Content-Type",
            notice.file.mimetype || "application/octet-stream",
        );

        response.data.pipe(res);
    } catch (error) {
        res.status(500).json({ message: "Download failed" });
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

        if (title) notice.title = title;
        if (description) notice.description = description;
        if (categories) notice.categories = parseArray(categories);
        if (allowedRoles) notice.allowedRoles = parseArray(allowedRoles);

        // ================= IMAGE UPDATE (Cloudinary) =================
        if (req.file) {
            // delete old image from cloudinary
            if (notice.file?.public_id) {
                await cloudinary.uploader.destroy(notice.file.public_id, {
                    resource_type: "image",
                });
            }

            // save new image
            const fullPublicId = req.file.filename.includes("/")
                ? req.file.filename
                : `university/notices/${req.file.filename}`;

            // save new image info
            notice.file = {
                url: req.file.path, // cloudinary secure url
                originalname: req.file.originalname,
                filename: req.file.filename,
                public_id: fullPublicId, // cloudinary public_id
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
            meta: {
                title: notice.title,
            },
        });

        res.json({
            message: "Notice updated successfully",
            notice,
        });
    } catch (error) {
        console.error(error);
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
const restoreNoticesOld = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "ids array is required" });
        }

        const result = await Notice.updateMany(
            {
                _id: { $in: ids },
                isDeleted: true,
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

const restoreNotices = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "ids array is required" });
        }

        const notices = await Notice.find({
            _id: { $in: ids },
            isDeleted: true,
        }).select("title");

        if (notices.length === 0) {
            return res.status(400).json({
                message: "No deleted notices found to restore",
            });
        }

        // restore
        const result = await Notice.updateMany(
            {
                _id: { $in: ids },
                isDeleted: true,
            },
            {
                $set: {
                    isDeleted: false,
                    deletedAt: null,
                },
            },
        );

        // AUDIT LOG (with title)
        for (const notice of notices) {
            await logAudit({
                adminId: req.user.id,
                action: "NOTICE_RESTORE",
                targetType: "Notice",
                targetId: notice._id,
                meta: {
                    title: notice.title,
                },
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
            // ================= DELETE IMAGE FROM CLOUDINARY =================
            if (notice.file?.public_id) {
                try {
                    await cloudinary.uploader.destroy(notice.file.public_id, {
                        resource_type: "image",
                    });
                } catch (err) {
                    console.error(
                        "Cloudinary delete failed:",
                        notice.file.public_id,
                        err.message,
                    );
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
                meta: {
                    title: notice.title,
                },
            });
        }

        res.json({
            message: "Permanent delete completed",
            requested: ids.length,
            deleted: deletedCount,
        });
    } catch (error) {
        console.error(error);
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
