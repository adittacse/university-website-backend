const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

/**
 * @swagger
 * /api/protected/user:
 *   get:
 *     summary: Protected route (any logged-in user)
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/user", auth, (req, res) => {
    res.json({ message: "You are logged in", user: req.user });
});

/**
 * @swagger
 * /api/protected/admin:
 *   get:
 *     summary: Admin only route
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 */
router.get("/admin", auth, role(["admin"]), (req, res) => {
    res.json({ message: "Welcome Admin" });
});

module.exports = router;
