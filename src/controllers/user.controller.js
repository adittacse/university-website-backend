const User = require("../models/User");
const Role = require("../models/Role");
const logAudit = require("../utils/auditLogger");

/**
 * GET /api/users
 * Admin only
 */
const getUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 10;
        const search = req.query.search || "";

        const query = {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ],
        };

        const total = await User.countDocuments(query);

        const users = await User.find(query)
            .populate("role", "name")
            .select("-password")
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ name: "asc" });

        res.json({
            data: users,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

/**
 * Admin only
 */
const getAdminsOnly = async (req, res) => {
    try {
        const adminRole = await Role.findOne({ name: "admin" });

        if (!adminRole) {
            return res.status(404).json({
                message: "Admin role not found",
            });
        }
        
        const admins = await User.find({ role: adminRole._id })
            .select("_id name email")
            .sort({ name: 1 });

        res.json(admins);
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch admins",
            error: err.message,
        });
    }
};


/**
 * UPDATE USER ROLE (Admin only)
 */
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleId } = req.body;

        if (!roleId) {
            return res.status(400).json({ message: "roleId is required" });
        }

        // check role exists
        const newRole = await Role.findById(roleId);
        if (!newRole) {
            return res.status(404).json({ message: "Role not found" });
        }

        // update user role
        // const user = await User.findByIdAndUpdate(
        //     id,
        //     { role: newRole._id },
        //     { new: true },
        // ).populate("role", "name");

        const user = await User.findById(id).populate("role");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const oldRoleName = user.role?.name || "student";

        // update user role
        user.role = newRole._id;
        await user.save();

        await user.populate("role", "name");

        await logAudit({
            adminId: req.user.id,
            action: "USER_ROLE_CHANGE",
            targetType: "User",
            targetId: user._id,
            meta: {
                userName: user.name,
                userEmail: user.email,
                oldRole: oldRoleName,
                newRole: newRole.name,
            },
        });

        res.json({
            message: "User role updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update user role",
            error: error.message,
        });
    }
};

/**
 * DELETE /api/users/:id
 * Admin only (soft delete)
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete user" });
    }
};

module.exports = { getUsers, getAdminsOnly, updateUserRole, deleteUser };