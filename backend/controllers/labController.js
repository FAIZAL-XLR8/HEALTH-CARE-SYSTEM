const Lab = require('../models/Lab');

// GET /api/labs/search-test
// Query parameters: test (e.g. "cbc"), lat, lng, radius (in meters)
exports.searchTest = async (req, res) => {
  try {
    const { test, lat, lng, radius } = req.query;

    if (!test) {
      return res.status(400).json({ message: 'Test ID query parameter is required.' });
    }

    // Default to central Indiranagar, Bengaluru coordinates if not supplied
    const userLng = parseFloat(lng) || 77.641151;
    const userLat = parseFloat(lat) || 12.971891;
    const searchRadius = parseInt(radius) || 10000; // Default 10km search radius

    // MongoDB Aggregation utilizing $geoNear to calculate distances dynamically
    const matchedLabs = await Lab.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [userLng, userLat],
          },
          distanceField: 'distanceInMeters',
          maxDistance: searchRadius,
          spherical: true,
          query: { 'tests.testId': test }, // Filter labs offering this specific test
        },
      },
      {
        $project: {
          name: 1,
          nablAccredited: 1,
          homeCollection: 1,
          rating: 1,
          location: 1,
          distanceInMeters: 1,
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
      const distanceInKm = parseFloat((lab.distanceInMeters / 1000).toFixed(1));

      return {
        labId: lab._id,
        labName: lab.name,
        nablAccredited: lab.nablAccredited,
        homeCollection: lab.homeCollection,
        rating: lab.rating,
        coordinates: lab.location.coordinates,
        distanceKm: distanceInKm,
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
      searchCoordinates: [userLng, userLat],
      isStaleCache: isAnyStale || req.query.forceRefresh === 'true',
      providersCount: providers.length,
      providers,
    });
  } catch (error) {
    console.error('Error in searchTest controller:', error);
    res.status(500).json({ message: 'Internal Server Error during spatial test lookup.' });
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
