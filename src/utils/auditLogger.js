const AuditLog = require("../models/AuditLog");

const logAudit = async ({
    adminId,
    action,
    targetType,
    targetId,
    meta = {},
}) => {
    try {
        await AuditLog.create({ admin: adminId, action, targetType, targetId, meta });
    } catch (error) {
        console.error("Audit log failed:", error.message);
    }
};

module.exports = logAudit;
