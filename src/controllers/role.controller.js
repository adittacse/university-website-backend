const Role = require("../models/Role");

// CREATE role
const createRole = async (req, res) => {
    try {
        const { name } = req.body;

        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(409).json({ message: `Role '${name}' already exists` });
        }

        const role = await Role.create({ name });
        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create role",
            error: error.message,
        });
    }
};

// GET all roles
const getRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE role
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const exists = await Role.findOne({ name, _id: { $ne: id } });
        if (exists) {
            return res.status(409).json({ message: `Role '${name}' already exists` });
        }

        const role = await Role.findByIdAndUpdate(id, { name }, { new: true });

        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        res.json(role);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE role
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findByIdAndDelete(id);

        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        res.json({ message: "Role deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createRole, getRoles, updateRole, deleteRole };
