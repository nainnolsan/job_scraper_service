import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        // Railway variables default to MONGO_URL, but we also support MONGO_URI
        const mongoURI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/portafolio_jobs';
        await mongoose.connect(mongoURI);
        console.log('[MongoDB] Connected successfully to Database via Mongoose');
    } catch (error) {
        console.error('[MongoDB] Connection failed:', error);
        process.exit(1);
    }
};
