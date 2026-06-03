const Lab = require('../models/Lab');

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

// Asynchronous Background Scraper Worker (Crawl Simulation)
// Simulated web scraping targeting pricing pages or private APIs
const executeBackgroundScrape = async (labId, testId) => {
  try {
    console.log(`🕵️ [Background Scraper] Initiating live crawl for Lab: ${labId}, Test: ${testId}...`);

    // Simulate standard scraping delay (1.5 seconds) to mimic actual Puppeteer crawling
    await new Promise(resolve => setTimeout(resolve, 1800));

    const lab = await Lab.findById(labId);
    if (!lab) {
      console.log(`🕵️ [Background Scraper] Error: Lab ${labId} not found.`);
      return;
    }

    // Find the test inside the embedded array
    const testIndex = lab.tests.findIndex(t => t.testId === testId);
    if (testIndex === -1) {
      console.log(`🕵️ [Background Scraper] Error: Test ${testId} not offered by lab ${lab.name}.`);
      return;
    }

    // Simulate price fluctuation (a real crawl might yield a revised price or static verification)
    const currentPrice = lab.tests[testIndex].price;
    
    // 50% chance of price change for demonstration, else stays verified
    const priceChange = Math.random() > 0.5 ? (Math.random() > 0.5 ? 20 : -20) : 0;
    const newPrice = currentPrice + priceChange;

    // Update in MongoDB
    lab.tests[testIndex].price = newPrice;
    lab.tests[testIndex].updatedAt = new Date(); // Reset freshness TTL
    await lab.save();

    console.log(`🕵️ [Background Scraper] Database Synced. Scraped Price: ₹${newPrice} (Was ₹${currentPrice})`);

    // Broadcast the new price immediately to the active UI cards over Server-Sent Events!
    broadcastPriceUpdate(labId, testId, newPrice, lab.tests[testIndex].tat);

  } catch (error) {
    console.error(`🕵️ [Background Scraper] Error crawling ${testId} for ${labId}:`, error);
  }
};

// Nightly Cron Job Scraper (Sequential Queue Pipeline)
const executeCronDailyScrape = async () => {
  try {
    console.log('🕵️ [Cron Daily Scraper] Triggering 2:00 AM sequential ETL pipeline...');
    const labs = await Lab.find();
    const testsList = ['cbc', 'lipid', 'hba1c'];

    for (const lab of labs) {
      console.log(`🕵️ [Cron Daily Scraper] Ingesting updates for Lab: ${lab.name}...`);
      
      for (const testId of testsList) {
        // Sequential query delay (Jitter) of 1.5 seconds to avoid IP block fires
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const testIndex = lab.tests.findIndex(t => t.testId === testId);
        if (testIndex !== -1) {
          // Verify price (mock fluctuation)
          const currentPrice = lab.tests[testIndex].price;
          const fluctuation = Math.random() > 0.7 ? 10 : 0;
          
          lab.tests[testIndex].price = currentPrice + fluctuation;
          lab.tests[testIndex].updatedAt = new Date();
        }
      }
      
      await lab.save();
      console.log(`🕵️ [Cron Daily Scraper] ✅ Lab ${lab.name} successfully updated.`);
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
