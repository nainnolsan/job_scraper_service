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

import axios from 'axios';
import { scrapeLinkedInJobs } from './services/linkedin.scraper';
import { scrapeHandshakeJobs } from './services/handshake.scraper';

// Unified daily cron job (runs every day at 3:00 AM)
cron.schedule('0 3 * * *', async () => {
    console.log('[Cron] Running daily job scraper task...');
    
    try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';
        console.log(`[Cron] Fetching user preferences from ${authServiceUrl}`);
        const response = await axios.get(`${authServiceUrl}/api/users/internal/preferences/all`);
        
        const allUsers = response.data.data;
        if (!allUsers || !Array.isArray(allUsers)) {
             console.error('[Cron] Failed to fetch valid preferences from auth-service');
             return;
        }

        // Deduplicate the global pool of keywords and locations
        const uniqueQueries = new Map<string, { keyword: string; location: string }>();

        allUsers.forEach((user: any) => {
            const preferences = user.preferences || [];
            preferences.forEach((pref: any) => {
                if (pref.keyword) {
                    const loc = pref.location || 'Remote';
                    const hash = `${pref.keyword.toLowerCase().trim()}|${loc.toLowerCase().trim()}`;
                    if (!uniqueQueries.has(hash)) {
                        uniqueQueries.set(hash, { keyword: pref.keyword, location: loc });
                    }
                }
            });
        });

        const unifiedSearches = Array.from(uniqueQueries.values());
        console.log(`[Cron] Global Pool Deduplicated. Running ${unifiedSearches.length} unique scraping tasks.`);

        // Process them sequentially to avoid bot blocking
        for (const search of unifiedSearches) {
             console.log(`[Cron] Search: ${search.keyword} in ${search.location}`);
             
             // Run LinkedIn
             await scrapeLinkedInJobs({ keywords: search.keyword, location: search.location });
             
             // Small delay between platforms
             await new Promise(resolve => setTimeout(resolve, 5000));
             
             // Run Handshake
             await scrapeHandshakeJobs({ keywords: search.keyword, location: search.location });
             
             // Larger delay before next cluster of keywords
             await new Promise(resolve => setTimeout(resolve, 15000));
        }
        
        console.log('[Cron] Daily scraper task completed successfully.');
    } catch (error: any) {
        console.error('[Cron] Error during daily execution:', error.message || error);
    }
});

app.listen(PORT, () => {
    console.log(`[Server] Job Scraper Service is running continuously on port ${PORT}`);
});
