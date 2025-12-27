const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { register, login, me } = require("../controllers/auth.controller");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & user session APIs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Aditta Chakraborty
 *               email:
 *                 type: string
 *                 example: adittacse@gmail.com
 *               password:
 *                 type: string
 *                 example: Aditta123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: adittacse@gmail.com
 *               password:
 *                 type: string
 *                 example: Aditta123
 *     responses:
 *       200:
 *         description: Login successful (JWT set in HttpOnly cookie)
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get currently logged-in user
 *     description: |
 *       Returns the currently authenticated user's profile.
 *       Authentication is handled via JWT stored in HttpOnly cookie.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged-in user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 64f1c2e9a9b123456789abcd
 *                 name:
 *                   type: string
 *                   example: Aditta Chakraborty
 *                 email:
 *                   type: string
 *                   example: adittacse@gmail.com
 *                 role:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64fa999aaa888bbb777666
 *                     name:
 *                       type: string
 *                       example: student
 *                 createdAt:
 *                   type: string
 *                   example: 2025-01-01T10:20:30.000Z
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       500:
 *         description: Server error
 */
router.get("/me", authMiddleware, me);

module.exports = router;
