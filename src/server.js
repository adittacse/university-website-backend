require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

connectDB();

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PROTOCOL}://${process.env.HOST}:${PORT}`);
});
