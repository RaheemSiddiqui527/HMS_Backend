import dotenv from "dotenv";
import mongoose from "mongoose"

dotenv.config();

const DB_URI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1);
    }
}

export default connectDB;
