import { Router, Request, Response } from 'express';
import { scrapeLinkedInJobs } from '../services/linkedin.scraper';
import { scrapeHandshakeJobs } from '../services/handshake.scraper';
import Job from '../models/Job';

const router = Router();

// Endpoint to fetch jobs from MongoDB for the Tinder UI
router.get('/jobs', async (req: Request, res: Response) => {
    try {
        const { keyword, location } = req.query;
        let filter: any = {};
        
        if (keyword) {
            filter.title = { $regex: new RegExp(keyword as string, 'i') };
        }
        if (location) {
            filter.location = { $regex: new RegExp(location as string, 'i') };
        }
        
        const jobs = await Job.find(filter).sort({ datePosted: -1 }).limit(100);
        res.json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

router.post('/linkedin', async (req: Request, res: Response) => {
    try {
        const result = await scrapeLinkedInJobs(req.body);
        res.json({ message: 'LinkedIn scraping completed', data: result });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.post('/handshake', async (req: Request, res: Response) => {
    try {
        const result = await scrapeHandshakeJobs(req.body);
        res.json({ message: 'Handshake scraping completed', data: result });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

export default router;
