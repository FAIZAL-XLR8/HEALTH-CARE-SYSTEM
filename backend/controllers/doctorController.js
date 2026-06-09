const Doctor = require('../models/Doctor');

// GET /api/doctors/search
// Query parameters: specialty (e.g. "ENT"), lat, lng, radius (in meters)
exports.searchDoctors = async (req, res) => {
  try {
    const { specialty, lat, lng, radius } = req.query;

    if (!specialty) {
      return res.status(400).json({ message: 'Specialty query parameter is required.' });
    }

    // Default to central Indiranagar, Bengaluru coordinates if not supplied
    const userLng = parseFloat(lng) || 77.641151;
    const userLat = parseFloat(lat) || 12.971891;
    const searchRadius = parseInt(radius) || 10000; // Default 10km search radius

    // MongoDB Aggregation utilizing $geoNear to calculate distances dynamically
    const matchedDoctors = await Doctor.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [userLng, userLat],
          },
          distanceField: 'distanceInMeters',
          maxDistance: searchRadius,
          spherical: true,
          query: { specialty: { $regex: new RegExp(specialty, 'i') } }, // Case-insensitive matching
        },
      },
    ]);

    // Format the response to present clean, structured comparative data
    const doctors = matchedDoctors.map(doc => {
      const distanceInKm = parseFloat((doc.distanceInMeters / 1000).toFixed(1));

      return {
        doctorId: doc._id,
        name: doc.name,
        specialty: doc.specialty,
        experience: doc.experience,
        clinicName: doc.clinicName,
        fee: doc.fee,
        googleRating: doc.googleRating,
        scrapedRating: doc.scrapedRating,
        coordinates: doc.location.coordinates,
        distanceKm: distanceInKm,
        activeHours: doc.activeHours,
      };
    });

    res.status(200).json({
      specialty,
      searchCoordinates: [userLng, userLat],
      doctorsCount: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error('Error in searchDoctors controller:', error);
    res.status(500).json({ message: 'Internal Server Error during spatial doctor lookup.' });
  }
};

// GET /api/doctors/compare
// Query parameters: ids (comma-separated Doctor Mongoose Object IDs)
exports.compareDoctors = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ message: 'Doctor ID parameters are required for comparative lookup.' });
    }

    const doctorIds = ids.split(',').filter(id => id.trim().length > 0);

    const doctors = await Doctor.find({ _id: { $in: doctorIds } });

    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error in compareDoctors controller:', error);
    res.status(500).json({ message: 'Internal Server Error during doctor comparison matrix fetch.' });
  }
};
