const Doctor = require('../models/Doctor');
const { scrapeLybrateDoctors } = require('./lybrateScraper');

// Nightly Cron Job Scraper (Sequential Queue Pipeline)
const executeCronDailyScrape = async () => {
  try {
    console.log('🕵️ [Cron Daily Scraper] Triggering 2:00 AM sequential ETL pipeline...');

    // Crawl and ingest Doctor lists from Lybrate
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
  executeCronDailyScrape,
};
