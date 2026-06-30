const Doctor = require('../models/Doctor');
const { resolveSpecialty } = require('../utils/specialityResolver');

// GET /api/doctors/search
// Query parameters: specialty (e.g. "ENT")
exports.searchDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;

    if (!specialty) {
      return res.status(400).json({ message: 'Specialty query parameter is required.' });
    }

    const resolvedSpecialties = await resolveSpecialty(specialty);
    console.log(`🏥 [Doctor Controller] User query "${specialty}" resolved to:`, resolvedSpecialties);

    for (const resolvedSpecialty of resolvedSpecialties) {
      console.log(`🔍 [Doctor Controller] Attempting search/scrape for resolved specialty: "${resolvedSpecialty}"`);
      
      // Find all doctors with matching specialization in MongoDB
      let matchedDoctors = await Doctor.find({
        specialization: { $regex: new RegExp('\\b' + resolvedSpecialty.trim() + '\\b', 'i') },
        status: 'approved',
        isVerified: true
      }).lean();

      // If no local doctors found, trigger live Lybrate crawler
      if (matchedDoctors.length === 0) {
        try {
          console.log(`🕵️ [Live Doctor Crawler] Cache empty for '${resolvedSpecialty}'. Querying Lybrate...`);
          const { scrapeLybrateDoctors } = require('../services/lybrateScraper');
          const { geocodeAddress } = require('../utils/geocoder');

          const scrapedDocs = await scrapeLybrateDoctors('Bengaluru', resolvedSpecialty);

          if (scrapedDocs && scrapedDocs.length > 0) {
            // Deduplicate by name + specialty before inserting
            const seen = new Set();
            const uniqueDocs = [];
            for (const doc of scrapedDocs) {
              const key = `${doc.name.toLowerCase().trim()}|${doc.specialty.toLowerCase().trim()}`;
              if (!seen.has(key)) {
                seen.add(key);
                uniqueDocs.push(doc);
              }
            }

            // Insert sequentially to prevent race conditions on duplicate checks
            for (const doc of uniqueDocs) {
              const exists = await Doctor.findOne({
                name: { $regex: new RegExp('^' + doc.name.trim() + '$', 'i') },
                specialization: { $regex: new RegExp('^' + doc.specialty.trim() + '$', 'i') }
              });

              if (!exists) {
                // Geocode the real scraped clinic address — no random offsets
                const coordinates = await geocodeAddress(doc.address);

                // Deterministic email from name + specialty slug (no timestamp randomness)
                const nameSlug = doc.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const specialtySlug = doc.specialty.toLowerCase().replace(/[^a-z0-9]/g, '');
                // Phone not available from scrape — generate numeric placeholder
                const placeholderPhone = 9000000000 + Math.floor(Math.random() * 999999999);

                await Doctor.create({
                  name: doc.name,
                  email: `${nameSlug}.${specialtySlug}@lybrate.scraped`,
                  password: 'scraped_placeholder_not_for_login',
                  phone: placeholderPhone,
                  specialization: doc.specialty,
                  experienceYears: doc.experience || 0,
                  consultationFee: doc.fee || 0,
                  isOnline: false,
                  status: 'approved',
                  isVerified: true,
                  location: {
                    type: 'Point',
                    coordinates,  // real geocoded [lng, lat] or Bengaluru center fallback
                  },
                });
              }
            }

            // Re-query after inserts
            matchedDoctors = await Doctor.find({
              specialization: { $regex: new RegExp('\\b' + resolvedSpecialty.trim() + '\\b', 'i') },
              status: 'approved',
              isVerified: true
            }).lean();
          }
        } catch (scrapeError) {
          console.error('❌ [Live Doctor Crawler] Failed:', scrapeError.message);
        }
      }

      // If we found doctors (either locally or through scraper), return immediately!
      if (matchedDoctors.length > 0) {
        console.log(`✅ [Doctor Controller] Found ${matchedDoctors.length} doctors for resolved specialty "${resolvedSpecialty}". Stopping search loop.`);
        const doctors = matchedDoctors.map(doc => ({
          doctorId: doc._id,
          name: doc.name,
          specialty: doc.specialization,
          specialization: doc.specialization,
          experience: doc.experienceYears,
          experienceYears: doc.experienceYears,
          fee: doc.consultationFee,
          consultationFee: doc.consultationFee,
          coordinates: doc.location ? doc.location.coordinates : null,
          activeHours: doc.activeHours,
          profileImage: doc.profileImage || '',
          isOnline: doc.isOnline,
        }));

        return res.status(200).json({
          specialty: resolvedSpecialty,
          doctorsCount: doctors.length,
          doctors,
        });
      }
    }

    // If loop finishes and no doctors were found for any resolved specialty
    console.log(`❌ [Doctor Controller] No doctors found for any of the resolved specialties:`, resolvedSpecialties);
    return res.status(200).json({
      specialty: specialty,
      doctorsCount: 0,
      doctors: [],
      message: "We couldn't find specialists for your request. Showing General Physicians may be the best next step."
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
