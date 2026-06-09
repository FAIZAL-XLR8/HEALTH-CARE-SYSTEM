const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes a live diagnostic test price from Pathkind Labs directory.
 * @param {string} testId - The test identifier ('cbc', 'lipid', 'hba1c')
 * @returns {Promise<number|null>} The scraped price or null if not found
 */
const URL_MAP = {
  cbc: 'https://www.pathkindlabs.com/diagnostic/complete-blood-count-cbc',
  lipid: 'https://www.pathkindlabs.com/diagnostic/lipid-profile',
  hba1c: 'https://www.pathkindlabs.com/diagnostic/hba1c-glycosylated-hemoglobin'
};

/**
 * Scrapes a live diagnostic test price from Pathkind Labs directory.
 * @param {string} testId - The test identifier ('cbc', 'lipid', 'hba1c')
 * @returns {Promise<number|null>} The scraped price or null if not found
 */
async function scrapePathkindPrice(testId) {
  const normalizedTestId = testId.toLowerCase();
  const targetUrl = URL_MAP[normalizedTestId];

  if (!targetUrl) {
    console.log(`🕵️ [Pathkind Scraper] No configured URL mapping for test '${testId}'.`);
    return null;
  }

  console.log(`🕵️ [Pathkind Scraper] Querying live test details at ${targetUrl}...`);

  try {
    // 1. Fetch raw HTML of the specific test page
    const { data: html } = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000 // 15 seconds timeout
    });

    // 2. Parse HTML using cheerio
    const $ = cheerio.load(html);
    let scrapedPrice = null;

    // 3. Extract price from schema.org Product metadata (JSON-LD)
    $('script[type="application/ld+json"]').each((index, element) => {
      try {
        const json = JSON.parse($(element).text().trim());
        if (json && json['@type'] === 'Product' && json.offers) {
          const parsedPrice = parseInt(json.offers.price, 10);
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            scrapedPrice = parsedPrice;
            return false; // Break the cheerio each loop
          }
        }
      } catch (e) {
        // Ignore parsing errors for other non-related JSON-LD scripts
      }
    });

    if (scrapedPrice) {
      console.log(`🕵️ [Pathkind Scraper] Found price for ${testId}: ₹${scrapedPrice}`);
      return scrapedPrice;
    } else {
      console.log(`🕵️ [Pathkind Scraper] Price for '${testId}' not found in page metadata. Using baseline fallback.`);
      return null;
    }

  } catch (error) {
    console.error(`🕵️ [Pathkind Scraper] Failed fetching live data:`, error.message);
    return null;
  }
}

module.exports = {
  scrapePathkindPrice
};
