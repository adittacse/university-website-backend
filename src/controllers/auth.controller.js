const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * REGISTER USER
 * Default role = student
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        // check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: "User already exists with this email",
            });
        }

        // find default role (student)
        const studentRole = await Role.findOne({ name: "student" });
        if (!studentRole) {
            return res.status(500).json({
                message:
                    "Default role 'student' not found. Please seed roles first.",
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: studentRole._id, // 🔥 dynamic role ObjectId
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: studentRole.name,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message,
        });
    }
};

/**
 * LOGIN USER
 * JWT stored in HttpOnly cookie
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        // find user with role populated
        const user = await User.findOne({ email }).populate("role");
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // compare password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        // create JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role._id.toString(),
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
        );

        // set token in HttpOnly cookie
        // res.cookie("token", token, {
        //     httpOnly: true,
        //     sameSite: "lax",
        //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role.name,
            },
        });

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role.name, // readable role name
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message,
        });
    }
};

/**
 * GET CURRENT LOGGED-IN USER
 * Useful for frontend / dashboard
 */
const me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("role", "name")
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch user",
            error: error.message,
        });
    }
};

module.exports = { register, login, me };
