const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const roleCheck = require("../middlewares/role.middleware");
const { getAuditLogs } = require("../controllers/audit.controller");

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get audit logs with pagination & filters (Admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           example: NOTICE_DELETE
 *       - in: query
 *         name: admin
 *         schema:
 *           type: string
 *           example: 64fabc123...
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           example: Notice
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2025-01-01
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2025-12-31
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *       403:
 *         description: Access denied
 */
router.get("/", auth, roleCheck(["admin"]), getAuditLogs);

module.exports = router;
