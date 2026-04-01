import { chromium } from 'playwright';
import Job from '../models/Job';

interface SearchParams {
    keywords: string;
    location?: string;
}

export async function scrapeLinkedInJobs(searchParams: SearchParams) {
    console.log('[LinkedIn Scraper] Starting extraction...', searchParams);
    const { keywords, location = 'Worldwide' } = searchParams;
    
    // Launch Chromium instance
    const browser = await chromium.launch({ headless: true });
    // Use a custom User-Agent to reduce bot detection
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    const jobsFound = [];

    try {
        const encodedKeywords = encodeURIComponent(keywords);
        const encodedLocation = encodeURIComponent(location);
        // LinkedIn public job search URL
        const url = `https://www.linkedin.com/jobs/search?keywords=${encodedKeywords}&location=${encodedLocation}&position=1&pageNum=0`;

        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Wait for page JavaScript to render the job cards
        await page.waitForTimeout(3000); 
        
        // Note: LinkedIn frequently changes its DOM classes. '.base-card' is typical for public search.
        const jobCards = await page.$$('.base-search-card');

        for (const card of jobCards) {
            try {
                const titleElement = await card.$('.base-search-card__title');
                const companyElement = await card.$('.base-search-card__subtitle');
                const locationElement = await card.$('.job-search-card__location');
                const linkElement = await card.$('a.base-card__full-link');

                const title = titleElement ? await titleElement.innerText() : 'Unknown';
                const company = companyElement ? await companyElement.innerText() : 'Unknown';
                const jobLocation = locationElement ? await locationElement.innerText() : 'Unknown';
                const link = linkElement ? await linkElement.getAttribute('href') : '';

                if (link && title !== 'Unknown') {
                    const jobData = {
                        title: title.trim(),
                        company: company.trim(),
                        location: jobLocation.trim(),
                        // Clean URL tracking query parameters
                        link: link.split('?')[0], 
                        platform: 'LinkedIn' as const
                    };

                    jobsFound.push(jobData);
                    
                    // Save to MongoDB. Upsert prevents duplicate jobs.
                    await Job.findOneAndUpdate(
                        { link: jobData.link },
                        { $set: jobData },
                        { upsert: true, returnDocument: 'after' }
                    );
                }
            } catch (err) {
                console.error('[LinkedIn Scraper] Error parsing a job card:', err);
            }
        }
    } catch (error) {
         console.error('[LinkedIn Scraper] Critical error during scraping:', error);
    } finally {
        await browser.close();
    }

    console.log(`[LinkedIn Scraper] Extraction complete. Found ${jobsFound.length} jobs.`);
    return jobsFound;
}
