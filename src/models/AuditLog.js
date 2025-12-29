const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        action: {
            type: String,
            required: true,
            enum: [
                "NOTICE_CREATE",
                "NOTICE_UPDATE",
                "NOTICE_DELETE", // soft delete
                "NOTICE_RESTORE",
                "NOTICE_PERMANENT_DELETE", // permanent delete
                "NOTICE_VIEW",
                "NOTICE_DOWNLOAD",
                "USER_ROLE_CHANGE",
            ],
        },
        targetType: {
            type: String,
            required: true,
            enum: ["Notice", "User"],
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        meta: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true
    },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
