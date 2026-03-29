import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import scraperRoutes from './routes/scraper.routes';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Initialize Database connection
connectDB();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'job-scraper-service' });
});

// Register routes
app.use('/api/scrape', scraperRoutes);

// Basic cron job scaffolding (runs every day at 3:00 AM)
cron.schedule('0 3 * * *', () => {
    console.log('[Cron] Running daily job scraper task...');
    // Scraper logic will be triggered here
});

app.listen(PORT, () => {
    console.log(`[Server] Job Scraper Service is running continuously on port ${PORT}`);
});
