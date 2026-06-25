const Lab = require('../models/Lab');

// GET /api/labs/search-test
// Query parameters: test (e.g. "cbc")
exports.searchTest = async (req, res) => {
  try {
    const { test } = req.query;

    if (!test) {
      return res.status(400).json({ message: 'Test ID query parameter is required.' });
    }

    // MongoDB Aggregation utilizing $match to filter labs offering this specific test
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
          // Extract only the matching test details from the embedded array
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

    // Format the response to present clean, structured comparative data
    const providers = matchedLabs.map(lab => {
      const testDetail = lab.matchingTest && lab.matchingTest[0];

      return {
        labId: lab._id,
        labName: lab.name,
        nablAccredited: lab.nablAccredited,
        homeCollection: lab.homeCollection,
        googleRating: lab.googleRating,
        scrapedRating: lab.scrapedRating,
        coordinates: lab.location ? lab.location.coordinates : null,
        price: testDetail ? testDetail.price : null,
        tat: testDetail ? testDetail.tat : null,
        updatedAt: testDetail ? testDetail.updatedAt : null,
      };
    });

    // Determine if any of the returned prices are stale (> 24 hours old)
    const now = new Date();
    let isAnyStale = false;

    providers.forEach(provider => {
      if (provider.price) {
        let isStale = false;
        if (!provider.updatedAt) {
          isStale = true;
        } else {
          const hoursSinceUpdate = Math.abs(now - new Date(provider.updatedAt)) / 36e5;
          isStale = hoursSinceUpdate > 24;
        }

        if (isStale) {
          isAnyStale = true;
        }

        // Trigger background scraping asynchronously if stale OR if user forced a refresh
        if (isStale || req.query.forceRefresh === 'true') {
          const { executeBackgroundScrape } = require('../services/scraperService');
          executeBackgroundScrape(provider.labId, test);
        }
      }
    });

    res.status(200).json({
      testId: test,
      isStaleCache: isAnyStale || req.query.forceRefresh === 'true',
      providersCount: providers.length,
      providers,
    });
  } catch (error) {
    console.error('Error in searchTest controller:', error);
    res.status(500).json({ message: 'Internal Server Error during test lookup.' });
  }
};

// GET /api/labs/compare
// Query parameters: ids (comma-separated Lab Mongoose Object IDs)
exports.compareLabs = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ message: 'Lab ID parameters are required for comparative lookup.' });
    }

    const labIds = ids.split(',').filter(id => id.trim().length > 0);

    const labs = await Lab.find({ _id: { $in: labIds } });

    res.status(200).json(labs);
  } catch (error) {
    console.error('Error in compareLabs controller:', error);
    res.status(500).json({ message: 'Internal Server Error during lab comparison matrix fetch.' });
  }
};
