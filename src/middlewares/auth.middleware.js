// const jwt = require("jsonwebtoken");

// const authMiddleware = (req, res, next) => {
//     let token = null;

//     if (req.cookies && req.cookies.token) {
//         token = req.cookies.token;
//     }

//     if (!token && req.headers.authorization) {
//         token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) {
//         return res.status(401).json({ message: "Unauthorized" });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (error) {
//         return res.status(401).json({ message: "Invalid token" });
//     }
// };

// module.exports = authMiddleware;


const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    let token;

    // 1. Authorization header (BEST)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    // 2. Cookie fallback (optional)
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;
