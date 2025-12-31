const express = require("express");
const router = express.Router();

const optionalAuth = require("../middlewares/optionalAuth.middleware");
const auth = require("../middlewares/auth.middleware");
const roleCheck = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");

const {
    createNotice,
    getNotices,
    getNoticeCounts,
    getNoticeById,
    downloadNotice,
    updateNotice,
    deleteNotice,
    restoreNotices,
    getDeletedNotices,
    permanentDeleteNotices
} = require("../controllers/notice.controller");

/**
 * @swagger
 * tags:
 *   name: Notice
 *   description: University notice management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notice:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         file:
 *           type: object
 *           properties:
 *             filename:
 *               type: string
 *             path:
 *               type: string
 *             mimetype:
 *               type: string
 *             size:
 *               type: number
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *         allowedRoles:
 *           type: array
 *           items:
 *             type: string
 *         downloadCount:
 *           type: number
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /api/notices:
 *   get:
 *     summary: Get all notices with pagination, search & filter
 *     description: Returns all notices visible to logged-in users
 *     tags: [Notice]
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
 *           example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: exam
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           example: 694db8a09c651bdd39fe4797
 *     responses:
 *       200:
 *         description: List of notices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notice'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", optionalAuth, getNotices);

/**
 * @swagger
 * /api/notices/deleted:
 *   get:
 *     summary: Get all soft-deleted notices (Admin only)
 *     tags: [Notice]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of deleted notices
 */
router.get("/deleted", auth, roleCheck(["admin", "teacher"]), getDeletedNotices);

router.get("/counts", auth, roleCheck(["admin", "teacher"]), getNoticeCounts);

/**
 * @swagger
 * /api/notices/permanent:
 *   delete:
 *     summary: Permanently delete one or multiple notices from trash (Admin only)
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - 64fdab123abc
 *                   - 64fdab456def
 *     responses:
 *       200:
 *         description: Permanent delete completed
 *       400:
 *         description: Invalid or missing IDs
 *       403:
 *         description: Admin only
 */
router.delete("/permanent", auth, roleCheck(["admin", "teacher"]), permanentDeleteNotices);

/**
 * @swagger
 * /api/notices/restore:
 *   patch:
 *     summary: Restore one or multiple soft-deleted notices
 *     tags:
 *       - Notice
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - 694dbea6c3ebb82c1e3171c4
 *                   - 694dbea6c3ebb82c1e3171c5
 *     responses:
 *       200:
 *         description: Notice(s) restored successfully
 */
router.patch("/restore", auth, roleCheck(["admin", "teacher"]), restoreNotices);

/**
 * @swagger
 * /api/notices:
 *   post:
 *     summary: Create a new notice
 *     description: Upload notice with file (PDF / Image / ZIP). Only admin can create notices.
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - file
 *             properties:
 *               title:
 *                 type: string
 *                 example: Final Exam Routine
 *               description:
 *                 type: string
 *                 example: Final semester exam routine for 2025
 *               categories:
 *                 type: string
 *                 example: '["694db8a09c651bdd39fe4797","694db8719c651bdd39fe4793"]'
 *               allowedRoles:
 *                 type: string
 *                 example: '["student","teacher"]'
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Notice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notice'
 *       400:
 *         description: File missing or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Server error
 */
router.post("/", auth, roleCheck(["admin", "teacher"]), upload.single("file"), createNotice);

/**
 * @swagger
 * /api/notices/{id}:
 *   get:
 *     summary: Get single notice details
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *     responses:
 *       200:
 *         description: Notice details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notice'
 *       401:
 *         description: Login required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Notice not found
 *       500:
 *         description: Server error
 */
router.get("/:id", optionalAuth, getNoticeById);

/**
 * @swagger
 * /api/notices/{id}:
 *   patch:
 *     summary: Update notice (Admin only)
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Notice ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Exam Routine
 *               description:
 *                 type: string
 *                 example: Updated description
 *               categories:
 *                 type: string
 *                 description: JSON array of category IDs
 *                 example: '["694db8a09c651bdd39fe4797"]'
 *               allowedRoles:
 *                 type: string
 *                 description: JSON array of role IDs
 *                 example: '["694db8fc005db4df2486b101","694db8ea005db4df2486b0fb"]'
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Notice updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Notice not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", auth, roleCheck(["admin", "teacher"]), upload.single("file"), updateNotice);

/**
 * @swagger
 * /api/notices/{id}:
 *   delete:
 *     summary: Delete notice (Admin only)
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Notice ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notice deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Notice not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", auth, roleCheck(["admin", "teacher"]), deleteNotice);

/**
 * @swagger
 * /api/notices/{id}/download:
 *   get:
 *     summary: Download notice file
 *     description: Downloads the notice file and increments download count
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *     responses:
 *       200:
 *         description: File download
 *       404:
 *         description: Notice not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/:id/download", optionalAuth, downloadNotice);

module.exports = router;
