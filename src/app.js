const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const protectedRoutes = require("./routes/protected.routes");
const roleRoutes = require("./routes/role.routes");
const categoryRoutes = require("./routes/category.routes");
const noticeRoutes = require("./routes/notice.routes");
const userRoutes = require("./routes/user.routes");
const auditRoutes = require("./routes/audit.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// middlewares
app.use(cors({
    origin: "http://localhost:3001",
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// static files (uploads)
app.use("/uploads", express.static("uploads"));

// swagger docs
// swagger setup must before router setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
        filter: true,
        docExpression: "list",
    }})
);

// routes
app.use("/api/auth", authRoutes);

// protected routes
app.use("/api/protected", protectedRoutes);

// roles
app.use("/api/roles", roleRoutes);

// categories
app.use("/api/categories", categoryRoutes);

// notice
app.use("/api/notices", noticeRoutes);

// users
app.use("/api/users", userRoutes);

// audit
app.use("/api/audit-logs", auditRoutes);

// admin dashboard
app.use("/api/admin", adminRoutes);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
    res.send("University Backend Running");
});

module.exports = app;
