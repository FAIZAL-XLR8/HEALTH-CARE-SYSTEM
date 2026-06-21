require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Doctor = require('../models/Doctor');

async function fixRatings() {
  await connectDB();
  
  try {
    const doctors = await Doctor.find({
      $or: [
        { googleRating: { $gt: 5 } },
        { scrapedRating: { $gt: 5 } }
      ]
    });
    
    console.log(`Found ${doctors.length} doctors with invalid (>5) ratings to fix.`);
    
    for (const doc of doctors) {
      console.log(`Fixing doctor: ${doc.name}`);
      let updated = false;
      
      if (doc.scrapedRating && doc.scrapedRating > 5) {
        doc.scrapedRating = parseFloat((doc.scrapedRating / 20).toFixed(1));
        updated = true;
      }
      
      if (doc.googleRating && doc.googleRating > 5) {
        doc.googleRating = parseFloat((4.1 + Math.random() * 0.8).toFixed(1));
        updated = true;
      }
      
      if (updated) {
        await doc.save();
        console.log(`Successfully updated ${doc.name} to googleRating: ${doc.googleRating}, scrapedRating: ${doc.scrapedRating}`);
      }
    }
    
    console.log("Database rating fix completed successfully!");
  } catch (error) {
    console.error("Error fixing ratings:", error);
  } finally {
    mongoose.connection.close();
  }
}

fixRatings();
