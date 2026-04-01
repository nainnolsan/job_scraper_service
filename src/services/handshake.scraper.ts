import { chromium } from 'playwright';
import Job from '../models/Job';

interface SearchParams {
    keywords: string;
    location?: string;
}

export async function scrapeHandshakeJobs(searchParams: SearchParams) {
    console.log('[Handshake Scraper] Starting extraction...', searchParams);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    const jobsFound = [];

    try {
        // IMPORTANT: Handshake requires an authenticated student session.
        // You MUST inject your SSO cookies here for this scraper to navigate successfully in production.
        // Example:
        // await context.addCookies([{ name: '_handshake_session', value: 'YOUR_COOKIE', domain: '.joinhandshake.com', path: '/' }]);

        const url = `https://app.joinhandshake.com/stu/postings?query=${encodeURIComponent(searchParams.keywords)}`;
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        await page.waitForTimeout(5000); // Give JS time to render the authenticated app

        // Placeholder logic: Since Handshake DOM requires an active session to inspect,
        // these are example selectors. You will need to inspect the live DOM to update these.
        const jobCards = await page.$$('[data-hook="job-card"]'); 

        for (const card of jobCards) {
             try {
                 const titleElement = await card.$('h2');
                 const title = titleElement ? await titleElement.innerText() : 'Unknown';
                 const link = 'https://app.joinhandshake.com/placeholder-link'; // Replace with actual link extraction

                 if (title !== 'Unknown') {
                     const jobData = {
                         title: title.trim(),
                         company: 'Handshake Employer',
                         location: searchParams.location || 'Remote',
                         link: link,
                         platform: 'Handshake' as const
                     };
 
                     jobsFound.push(jobData);
                     
                     await Job.findOneAndUpdate(
                         { link: jobData.link },
                         { $set: jobData },
                         { upsert: true, new: true }
                     );
                 }
             } catch (err) {
                 console.error('[Handshake Scraper] Error parsing a job card:', err);
             }
        }
    } catch (error) {
         console.error('[Handshake Scraper] Login or Navigation Error:', error);
    } finally {
        await browser.close();
    }

    console.log(`[Handshake Scraper] Extraction complete. Found ${jobsFound.length} jobs.`);
    return jobsFound;
}
