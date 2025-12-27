const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const roleCheck = require("../middlewares/role.middleware");
const { adminDashboard } = require("../controllers/admin.controller");

/**
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: token
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Admin dashboard metrics, stats & analytics (All-in-One)
 *     description: |
 *       Returns **all admin dashboard data in a single API call**.
 *
 *       Includes:
 *       - System metrics (notices, users, downloads, views)
 *       - Statistics (most downloaded / viewed notices)
 *       - Analytics (downloads over time)
 *
 *       🔐 **Admin only**
 *     tags:
 *       - Admin Dashboard
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     notices:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 120
 *                         active:
 *                           type: integer
 *                           example: 95
 *                         deleted:
 *                           type: integer
 *                           example: 25
 *                     files:
 *                       type: object
 *                       properties:
 *                         totalDownloads:
 *                           type: integer
 *                           example: 1340
 *                         totalViews:
 *                           type: integer
 *                           example: 5020
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 860
 *
 *                 stats:
 *                   type: object
 *                   properties:
 *                     mostDownloadedNotice:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 65ab1234abcd5678ef901234
 *                         title:
 *                           type: string
 *                           example: Final Exam Routine
 *                         downloadCount:
 *                           type: integer
 *                           example: 320
 *
 *                     mostViewedNotice:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 65cd5678abcd9012ef345678
 *                         title:
 *                           type: string
 *                           example: Holiday Notice
 *                         viewCount:
 *                           type: integer
 *                           example: 540
 *
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     downloadsLast7Days:
 *                       type: array
 *                       description: Daily download count for last 7 days
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "2025-01-02"
 *                           count:
 *                             type: integer
 *                             example: 55
 *
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *
 *       403:
 *         description: Forbidden (not an admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access denied
 *
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to load admin dashboard
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/dashboard", auth, roleCheck("admin"), adminDashboard);

module.exports = router;