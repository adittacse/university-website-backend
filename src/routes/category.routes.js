const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const roleCheck = require("../middlewares/role.middleware");

const {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
} = require("../controllers/category.controller");

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Notice category management
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create category
 *     tags: [Category]
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
 *                 example: General
 *               parent:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *     responses:
 *       200:
 *         description: Category created
 */
router.post("/", auth, roleCheck("admin"), createCategory);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category list
 */
router.get("/", auth, roleCheck("admin"), getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Update category
 *     tags: [Category]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Exam Notice
 *               parent:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Category updated
 */
router.patch("/:id", auth, roleCheck("admin"), updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Category]
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
 *         description: Category deleted
 */
router.delete("/:id", auth, roleCheck("admin"), deleteCategory);

module.exports = router;
