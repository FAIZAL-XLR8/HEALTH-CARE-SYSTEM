const { scrapePathkindPrice } = require('../services/pathkindScraper');
const { scrapeLybrateDoctors } = require('../services/lybrateScraper');

async function testLiveScrapers() {
  console.log("=== Starting Live Scraper Tests ===\n");

  // 1. Test Pathkind Price Scraper (Static - Axios/Cheerio)
  console.log("--- 1. Testing Pathkind Price Scraper ---");
  try {
    const cbcPrice = await scrapePathkindPrice('cbc');
    console.log(`[Result] Scraped CBC Price: ${cbcPrice}\n`);

    const lipidPrice = await scrapePathkindPrice('lipid');
    console.log(`[Result] Scraped Lipid Price: ${lipidPrice}\n`);
  } catch (err) {
    console.error("Pathkind scraper test failed:", err);
  }

  // 2. Test Lybrate Doctor Scraper (Dynamic - Puppeteer)
  console.log("--- 2. Testing Lybrate Doctor Scraper ---");
  try {
    // We scrape Cardiologists in Bengaluru (using mock query parameters)
    const doctors = await scrapeLybrateDoctors('Bengaluru', 'Cardiologist');
    console.log(`[Result] Scraped ${doctors.length} doctors.`);
    if (doctors.length > 0) {
      console.log("First Doctor Scraped Profile:", doctors[0]);
    }
  } catch (err) {
    console.error("Lybrate scraper test failed:", err);
  }

  console.log("\n=== Live Scraper Tests Completed ===");
}

testLiveScrapers();
