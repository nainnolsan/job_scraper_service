import { Router, Request, Response } from 'express';
import { scrapeLinkedInJobs } from '../services/linkedin.scraper';
import { scrapeHandshakeJobs } from '../services/handshake.scraper';

const router = Router();

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
