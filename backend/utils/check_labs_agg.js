require('dotenv').config();
const mongoose = require('mongoose');
const Lab = require('../models/Lab');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected!");
    const test = 'cbc';
    const matchedLabs = await Lab.aggregate([
      {
        $match: { 'tests.testId': test },
      },
      {
        $project: {
          name: 1,
          nablAccredited: 1,
          homeCollection: 1,
          googleRating: 1,
          scrapedRating: 1,
          location: 1,
          matchingTest: {
            $filter: {
              input: '$tests',
              as: 't',
              cond: { $eq: ['$$t.testId', test] },
            },
          },
        },
      },
    ]);
    console.log("Matched labs:", JSON.stringify(matchedLabs, null, 2));
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

check();
