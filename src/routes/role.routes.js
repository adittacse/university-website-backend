const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const roleCheck = require("../middlewares/role.middleware");

const {
    createRole,
    getRoles,
    updateRole,
    deleteRole,
} = require("../controllers/role.controller");

/**
 * @swagger
 * tags:
 *   name: Role
 *   description: Role management (Admin only)
 */

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create new role
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: teacher
 *     responses:
 *       200:
 *         description: Role created
 */
router.post("/", auth, roleCheck("admin"), createRole);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get("/", auth, roleCheck("admin"), getRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   patch:
 *     summary: Update role
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: staff
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch("/:id", auth, roleCheck("admin"), updateRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
 */
router.delete("/:id", auth, roleCheck("admin"), deleteRole);

module.exports = router;
