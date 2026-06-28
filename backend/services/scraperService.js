const Lab = require('../models/Lab');
const Doctor = require('../models/Doctor');
const { scrapePathkindPrice } = require('./pathkindScraper');
const { scrapeLybrateDoctors } = require('./lybrateScraper');

// Global list to track active Server-Sent Events (SSE) client streams
let activeClients = [];

// Register an active client connection
const registerSSEClient = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Unique ID for this client connection
  const clientId = Date.now();
  const newClient = { id: clientId, res };
  activeClients.push(newClient);

  console.log(`📡 SSE Connection opened for Client: ${clientId}. Total active: ${activeClients.length}`);

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Connection close cleanup
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    activeClients = activeClients.filter(client => client.id !== clientId);
    console.log(`📡 SSE Connection closed for Client: ${clientId}. Remaining active: ${activeClients.length}`);
  });
};

// Broadcast price updates in real-time to all listening React instances
const broadcastPriceUpdate = (labId, testId, price, tat) => {
  const payload = JSON.stringify({
    labId,
    testId,
    price,
    tat,
    isFresh: true,
  });

  console.log(`📡 SSE Broadcasting Update for Lab: ${labId}, Test: ${testId} ──> Price: ₹${price}`);

  activeClients.forEach(client => {
    client.res.write(`data: ${payload}\n\n`);
  });
};

// Asynchronous Background Scraper Worker (Real Live Crawler)
const executeBackgroundScrape = async (labId, testId) => {
  try {
    console.log(`🕵️ [Live Scraper Worker] Launching background scrape for Lab: ${labId}, Test: ${testId}...`);

    // Fetch the live price from Pathkind Labs portal
    const scrapedPrice = await scrapePathkindPrice(testId);

    const lab = await Lab.findById(labId);
    if (!lab) {
      console.log(`🕵️ [Live Scraper Worker] Error: Lab ${labId} not found.`);
      return;
    }

    // Find the test inside the embedded array
    const testIndex = lab.tests.findIndex(t => t.testId === testId);
    if (testIndex === -1) {
      console.log(`🕵️ [Live Scraper Worker] Error: Test ${testId} not offered by lab ${lab.name}.`);
      return;
    }

    const currentPrice = lab.tests[testIndex].price;
    // Update price if we successfully scraped a real value, else fallback to current price
    const finalPrice = scrapedPrice || currentPrice;

    // Update in MongoDB
    lab.tests[testIndex].price = finalPrice;
    lab.tests[testIndex].updatedAt = new Date(); // Reset TTL freshness
    await lab.save();

    console.log(`🕵️ [Live Scraper Worker] Database Synced. Scraped Price: ₹${finalPrice} (Was ₹${currentPrice})`);

    // Broadcast the new price immediately to the active UI cards over Server-Sent Events!
    broadcastPriceUpdate(labId, testId, finalPrice, lab.tests[testIndex].tat);

  } catch (error) {
    console.error(`🕵️ [Live Scraper Worker] Error in background scrape for ${testId}:`, error);
  }
};

// Nightly Cron Job Scraper (Sequential Queue Pipeline)
const executeCronDailyScrape = async () => {
  try {
    console.log('🕵️ [Cron Daily Scraper] Triggering 2:00 AM sequential ETL pipeline...');
    
    // 1. Crawl Lab diagnostic test prices dynamically
    const labs = await Lab.find();
    const testsList = ['cbc', 'lipid', 'hba1c'];

    for (const lab of labs) {
      console.log(`🕵️ [Cron Daily Scraper] Ingesting updates for Lab: ${lab.name}...`);
      
      for (const testId of testsList) {
        // Live scrape for this test
        const scrapedPrice = await scrapePathkindPrice(testId);
        
        const testIndex = lab.tests.findIndex(t => t.testId === testId);
        if (testIndex !== -1) {
          const currentPrice = lab.tests[testIndex].price;
          lab.tests[testIndex].price = scrapedPrice || currentPrice;
          lab.tests[testIndex].updatedAt = new Date();
        }
        
        // Wait 1.5 seconds to avoid spamming the registry server
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      await lab.save();
      console.log(`🕵️ [Cron Daily Scraper] ✅ Lab ${lab.name} successfully updated.`);
    }

    // 2. Crawl and ingest Doctor lists from Lybrate
    console.log('🕵️ [Cron Daily Scraper] Ingesting doctor directories from Lybrate...');
    
    // We scrape ENT specialist doctors in Jamshedpur
    const entDoctors = await scrapeLybrateDoctors('Jamshedpur', 'ENT');
    for (const doc of entDoctors) {
      await Doctor.findOneAndUpdate(
        { name: new RegExp('^' + doc.name + '$', 'i'), specialization: 'ENT' },
        { 
          $set: { 
            scrapedRating: doc.rating, 
            consultationFee: doc.fee,
            experienceYears: doc.experience,
            clinicName: doc.clinicName
          } 
        }
      );
    }

    // We scrape Cardiologists in Bengaluru
    const cardDoctors = await scrapeLybrateDoctors('Bengaluru', 'Cardiologist');
    for (const doc of cardDoctors) {
      await Doctor.findOneAndUpdate(
        { name: new RegExp('^' + doc.name + '$', 'i'), specialization: 'Cardiologist' },
        { 
          $set: { 
            scrapedRating: doc.rating, 
            consultationFee: doc.fee,
            experienceYears: doc.experience,
            clinicName: doc.clinicName
          } 
        }
      );
    }

    console.log('🕵️ [Cron Daily Scraper] Database synchronization completed.');
  } catch (error) {
    console.error('🕵️ [Cron Daily Scraper] Critical pipeline failure:', error);
  }
};

module.exports = {
  registerSSEClient,
  executeBackgroundScrape,
  executeCronDailyScrape,
};
