const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection Failed");
        console.error(error.message);

        process.exit(1); // <--- FIXED TYPO HERE (was pocess)
    }
};

module.exports = connectDB;