require("dotenv").config();

const mongoose = require("mongoose");
const connectDatabase = require("./src/config/database");
const User = require("./src/models/User");

const testUserModel = async () => {
    try {
        await connectDatabase();

        const user = await User.create({
            name: "Test Admin",
            email: "testadmin@logitrack.local",
            password: "temporary-password",
            role: "ADMIN",
            phone: "9876543210",
        });

        console.log("User created successfully:");
        console.log({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus,
        });

        await User.deleteOne({ _id: user._id });

        console.log("Test user deleted successfully");

        await mongoose.disconnect();

        console.log("MongoDB disconnected");
    } catch (error) {
        console.error("User model test failed:", error.message);

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        process.exit(1);
    }
};

testUserModel();