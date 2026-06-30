const puppeteer = require('puppeteer');

/**
 * Scrapes doctors from Lybrate for a given city and specialty.
 * @param {string} city - The city (e.g. 'Jamshedpur', 'Bangalore')
 * @param {string} specialty - The medical specialty (e.g. 'ENT', 'Cardiologist')
 * @returns {Promise<Array>} List of scraped doctor records
 */
async function scrapeLybrateDoctors(city, specialty) {
  // Normalize city slug for Lybrate's direct path structure (e.g. 'bengaluru' -> 'bangalore')
  let citySlug = city.toLowerCase().trim().replace(/\s+/g, '-');
  if (citySlug === 'bengaluru') {
    citySlug = 'bangalore';
  } else if (citySlug === 'new-delhi') {
    citySlug = 'delhi';
  }

  // Normalize specialty query for direct URL slug (e.g. 'ENT Specialist' -> 'ent-specialist')
  let specialtySlug = specialty.toLowerCase().trim()
    .replace('ear-nose-throat (ent) specialist', 'ent-specialist')
    .replace('ent specialist', 'ent-specialist')
    .replace(/^ent$/, 'ent-specialist')
    .replace('gynaecologist/obstetrician', 'gynaecologist')
    .replace('gynecologist/obstetrician', 'gynaecologist')
    .replace('gynecologist', 'gynaecologist')
    .replace(/\//g, '-')
    .replace(/\s+/g, '-');

  const TARGET_URL = `https://www.lybrate.com/${citySlug}/${specialtySlug}`;

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
    const doctors = await page.evaluate((specialty, city) => {
      // Find cards by matching Lybrate's unique CSS namespace
      const cards = document.querySelectorAll('div[class*="doctorCard_cardContainer"]');
      const results = [];
      const cityLower = city.toLowerCase();

      cards.forEach(card => {
        // Match child elements using wildcard selectors
        const nameNode = card.querySelector('[class*="doctorCard_doctorName"]');
        const expNode = card.querySelector('[class*="doctorCard_experience"]');
        const feeNode = card.querySelector('[class*="doctorCard_chargeWrapper"]');
        const clinicNode = card.querySelector('[class*="doctorCard_locationName"]');

        const clinicNameText = clinicNode ? clinicNode.innerText.trim() : '';
        const addressLower = clinicNameText.toLowerCase();

        // Strict local city filtering to prevent listing sponsored doctors from other cities
        let cityMatches = false;
        if (cityLower === 'bengaluru' || cityLower === 'bangalore') {
          cityMatches = addressLower.includes('bangalore') || addressLower.includes('bengaluru');
        } else if (cityLower === 'delhi' || cityLower === 'new delhi') {
          cityMatches = addressLower.includes('delhi') || addressLower.includes('new delhi') || addressLower.includes('ncr');
        } else {
          cityMatches = addressLower.includes(cityLower);
        }

        // If the card clinic address is present and doesn't contain our target city name, ignore it!
        if (clinicNameText && !cityMatches) {
          return;
        }

        const name = nameNode ? nameNode.innerText.trim().replace(/^Dr\.\s+/i, '') : null;
        const experience = expNode ? parseInt(expNode.innerText.replace(/[^0-9]/g, ''), 10) : 10;

        // Robust fee parser that handles original vs discounted prices and comma formatting (e.g. 1,000)
        let fee = null;
        if (feeNode) {
          const cleanedText = feeNode.innerText.replace(/\d+\s*%/g, '').replace(/,/g, '');
          const numbers = cleanedText.match(/\d+/g);
          if (numbers && numbers.length > 0) {
            const parsedNumbers = numbers.map(n => parseInt(n, 10)).filter(num => num > 0);
            if (parsedNumbers.length > 0) {
              fee = Math.min(...parsedNumbers);
            }
          }
        }

        const address = clinicNameText || '';

        if (name) {
          results.push({
            name,
            specialty,
            experience: isNaN(experience) ? 10 : experience,
            fee: isNaN(fee) || fee === null ? null : fee,
            address,
          });
        }
      });

      return results;
    }, specialty, city);

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
