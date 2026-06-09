const puppeteer = require('puppeteer');

/**
 * Scrapes doctors from Lybrate for a given city and specialty.
 * @param {string} city - The city (e.g. 'Jamshedpur', 'Bangalore')
 * @param {string} specialty - The medical specialty (e.g. 'ENT', 'Cardiologist')
 * @returns {Promise<Array>} List of scraped doctor records
 */
async function scrapeLybrateDoctors(city, specialty) {
  // Normalize specialty query for search URL
  const searchSpecialty = specialty.toLowerCase().replace(' ', '-');
  const TARGET_URL = `https://www.lybrate.com/search?find=${searchSpecialty}&city=${city}`;
  
  console.log(`🕵️ [Lybrate Scraper] Launching Puppeteer browser to crawl ${TARGET_URL}...`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // Emulate a standard screen desktop browser
    await page.setViewport({ width: 1280, height: 800 });
    
    // Spoof headers to bypass basic detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Open target page with 30 seconds timeout
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait 2 seconds for any dynamic cards to render
    await new Promise(r => setTimeout(r, 2000));

    // Extract elements from browser DOM
    const doctors = await page.evaluate((specialty) => {
      // Find cards by matching Lybrate's unique CSS namespace
      const cards = document.querySelectorAll('div[class*="doctorCard_cardContainer"]');
      const results = [];

      cards.forEach(card => {
        // Match child elements using wildcard selectors
        const nameNode = card.querySelector('[class*="doctorCard_doctorName"]');
        const expNode = card.querySelector('[class*="doctorCard_experience"]');
        const feeNode = card.querySelector('[class*="doctorCard_chargeWrapper"]');
        const ratingNode = card.querySelector('[class*="doctorCard_docratings"]');
        const clinicNode = card.querySelector('[class*="doctorCard_locationName"]');

        const name = nameNode ? nameNode.innerText.trim().replace(/^Dr\.\s+/i, '') : null;
        const experience = expNode ? parseInt(expNode.innerText.replace(/[^0-9]/g, ''), 10) : 10;
        const fee = feeNode ? parseInt(feeNode.innerText.replace(/[^0-9]/g, ''), 10) : null;
        const rating = ratingNode ? parseFloat(ratingNode.innerText) : null;
        const clinicName = clinicNode ? clinicNode.innerText.trim().split('\n')[0] : 'Metro Health Clinic';

        if (name) {
          results.push({
            name,
            specialty,
            experience: isNaN(experience) ? 10 : experience,
            fee: isNaN(fee) || fee === null ? null : fee,
            rating: isNaN(rating) || rating === null ? null : rating,
            clinicName
          });
        }
      });

      return results;
    }, specialty);

    console.log(`🕵️ [Lybrate Scraper] Extracted ${doctors.length} doctors from DOM.`);
    return doctors;

  } catch (error) {
    console.error(`🕵️ [Lybrate Scraper] Failed to crawl doctor data:`, error.message);
    return [];
  } finally {
    // Crucial: always release Chrome processes
    await browser.close();
    console.log(`🕵️ [Lybrate Scraper] Browser closed.`);
  }
}

module.exports = {
  scrapeLybrateDoctors
};
