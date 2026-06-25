const Doctor = require('../models/Doctor');

// GET /api/doctors/search
// Query parameters: specialty (e.g. "ENT")
exports.searchDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;

    if (!specialty) {
      return res.status(400).json({ message: 'Specialty query parameter is required.' });
    }

    // Find all doctors with matching specialization
    let matchedDoctors = await Doctor.find({
      specialization: { $regex: new RegExp('\\b' + specialty.trim() + '\\b', 'i') },
      status: 'approved',
      isVerified: true
    }).lean();

    // If matched doctors count in local cache is low, trigger live crawler from Lybrate
    if (matchedDoctors.length < 5) {
      try {
        console.log(`🕵️ [Live Doctor Crawler] Cache sparse (${matchedDoctors.length} records) for '${specialty}'. Querying Lybrate...`);
        const { scrapeLybrateDoctors } = require('../services/lybrateScraper');

        // Trigger live search for Bengaluru
        const scrapedDocs = await scrapeLybrateDoctors('Bengaluru', specialty);

        if (scrapedDocs && scrapedDocs.length > 0) {
          const defaultLng = 77.641151;
          const defaultLat = 12.971891;

          // Deduplicate scraped doctors
          const uniqueDocs = [];
          const seen = new Set();
          for (const doc of scrapedDocs) {
            const key = `${doc.name.toLowerCase().trim()}|${doc.specialty.toLowerCase().trim()}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueDocs.push(doc);
            }
          }

          // Insert sequentially to prevent query race conditions
          for (const doc of uniqueDocs) {
            const exists = await Doctor.findOne({
              name: { $regex: new RegExp('^' + doc.name.trim() + '$', 'i') },
              specialization: { $regex: new RegExp('^' + doc.specialty.trim() + '$', 'i') }
            });

            if (!exists) {
              const offsetLng = (Math.random() - 0.5) * 0.05;
              const offsetLat = (Math.random() - 0.5) * 0.05;
              const uniqueSlug = `${doc.name.toLowerCase().replace(/[^a-z]/g, '')}_${Date.now()}`;
              const mockPhone = `+919${Math.floor(100000000 + Math.random() * 900000000)}`;

              await Doctor.create({
                name: doc.name,
                email: `${uniqueSlug}@health.com`,
                password: 'default_scraped_password_123',
                phone: mockPhone,
                specialization: doc.specialty,
                experienceYears: doc.experience || 10,
                clinicName: doc.clinicName || 'Metro Health Clinic',
                consultationFee: doc.fee || 500,
                googleRating: null,
                scrapedRating: doc.rating,
                isOnline: false,
                lastSeen: new Date(),
                status: 'approved',
                isVerified: true,
                emailVerified: true,
                phoneVerified: true,
                location: {
                  type: 'Point',
                  coordinates: [defaultLng + offsetLng, defaultLat + offsetLat],
                },
                activeHours: '09:00 AM - 05:00 PM',
              });
            }
          }

          // Re-query database
          matchedDoctors = await Doctor.find({
            specialization: { $regex: new RegExp('\\b' + specialty.trim() + '\\b', 'i') },
            status: 'approved',
            isVerified: true
          }).lean();
        }
      } catch (scrapeError) {
        console.error('❌ [Live Doctor Crawler] Failed during dynamic search crawling:', scrapeError.message);
      }
    }

    // Format response payload for Map and Listings component compatibility
    const doctors = matchedDoctors.map(doc => {
      return {
        doctorId: doc._id,
        name: doc.name,
        specialty: doc.specialization, // compat alias
        specialization: doc.specialization,
        experience: doc.experienceYears, // compat alias
        experienceYears: doc.experienceYears,
        clinicName: doc.clinicName,
        fee: doc.consultationFee, // compat alias
        consultationFee: doc.consultationFee,
        googleRating: doc.googleRating,
        scrapedRating: doc.scrapedRating,
        coordinates: doc.location ? doc.location.coordinates : null,
        activeHours: doc.activeHours,
        profileImage: doc.profileImage || '',
        isOnline: doc.isOnline,
      };
    });

    res.status(200).json({
      specialty,
      doctorsCount: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error('Error in searchDoctors controller:', error);
    res.status(500).json({ message: 'Internal Server Error during doctor lookup.' });
  }
};

// GET /api/doctors/compare
// Query parameters: ids (comma-separated Doctor Object IDs)
exports.compareDoctors = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ message: 'Doctor ID parameters are required for comparative lookup.' });
    }

    const doctorIds = ids.split(',').filter(id => id.trim().length > 0);

    const doctorsList = await Doctor.find({ _id: { $in: doctorIds } });

    const formattedList = doctorsList.map(doc => ({
      ...doc._doc,
      // Compatibility mapping
      specialty: doc.specialization,
      experience: doc.experienceYears,
      fee: doc.consultationFee,
    }));

    res.status(200).json(formattedList);
  } catch (error) {
    console.error('Error in compareDoctors controller:', error);
    res.status(500).json({ message: 'Internal Server Error during doctor comparison matrix fetch.' });
  }
};
