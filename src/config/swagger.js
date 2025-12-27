const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
    openapi: "3.0.4",
    info: {
        title: "University API",
        version: "1.0.0",
        description: "University Management System API. ExpressJS + Mongoose (MongoDB)",
        contact: {
            email: "adittacse@gmail.com",
        },
    },
    basePath: "/",
    servers: [
        {
            url: `http://localhost:${process.env.PORT}`,
            description: "Localhost"
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            }
        }
    },
    tags: [
        { name: "Auth", description: "Authentication APIs" },
        { name: "Audit", description: "Audit logs" },
        { name: "Admin Dashboard", description: "Admin dashboard" },
        { name: "Category", description: "Notice category management" },
        { name: "Notice", description: "University notice management APIs" },
        { name: "Protected", description: "Protected APIs" },
        { name: "Role", description: "Role management (Admin only)" },
        { name: "User", description: "User management (Admin only)" },
    ]
};

const swaggerSpec = {
    definition: swaggerOptions,
    apis: ["./src/routes/*.js"],
}

module.exports = swaggerJsDoc(swaggerSpec);
