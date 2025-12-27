const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleCheck = require("../middlewares/role.middleware");
const { updateUserRole } = require("../controllers/user.controller");

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management (Admin only)
 */

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     description: |
 *       Change role of a user.
 *       Role must be a valid Role ID from Role collection.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: Role ObjectId
 *                 example: 694db8ea005db4df2486b0fb
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *       400:
 *         description: roleId missing
 *       401:
 *         description: Unauthorized Access
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: User or Role not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/role", authMiddleware, roleCheck("admin"), updateUserRole);

module.exports = router;
