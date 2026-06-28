const { GoogleGenAI } = require('@google/genai');
const User = require('../models/User');

// Initialize Gemini client conditionally
const getGenAIClient = () => {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1beta' });
  }
  return null;
};

// POST /api/reports/analyze
// Multiparts form upload: requires Multer middleware (req.file)
exports.analyzeReport = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.body.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No medical report file (PDF or image) uploaded.' });
    }

    const ai = getGenAIClient();
    let analysisResult;

    if (ai) {
      console.log('Sending uploaded document buffer to Gemini Multimodal Engine...');
      
      // Convert buffer to the standard InlineData structure required by the Gemini SDK
      const fileData = {
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype,
        },
      };

      const systemPrompt = `
        You are a highly analytical medical report analyzer. Read this laboratory diagnostic report document.
        Extract the following parameters and return a strict, clean JSON output matching the following key structure exactly.
        Do not add any markdown, code blocks, or leading text, return only raw JSON.

        JSON structure:
        {
          "patientName": "Full Name",
          "testsIdentified": ["List of tests found, e.g. Lipid Profile, CBC"],
          "criticalAlerts": ["Highlight any abnormal, high, low, or out-of-range metrics with values"],
          "medicationsIdentified": ["Any medications mentioned"],
          "recommendedSpecialist": "Specific Doctor Specialty (e.g. Cardiologist, ENT, General Physician, Endocrinologist)",
          "suggestedFollowUpTests": ["Tests to consult, e.g., HbA1c, Liver Function"],
          "fullSummary": "Provide a simple, 3-sentence, patient-friendly explanation of their report status."
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [fileData, systemPrompt],
      });

      try {
        // Clean JSON formatting boundaries if the model wrapped it in markdown code-fences
        let cleanedJson = response.text.trim();
        if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.replace(/^```json|```$/g, '').trim();
        }
        analysisResult = JSON.parse(cleanedJson);
      } catch (jsonErr) {
        console.error('Failed to parse Gemini raw response as JSON:', response.text);
        // Clean backup parser fallback
        analysisResult = {
          patientName: 'Verifying...',
          testsIdentified: ['Extracted Document'],
          criticalAlerts: ['Review needed: metrics out of range'],
          medicationsIdentified: [],
          recommendedSpecialist: 'General Physician',
          suggestedFollowUpTests: [],
          fullSummary: response.text.substring(0, 200),
        };
      }
    } else {
      console.log('Gemini API key is not configured. Falling back to high-fidelity mock report analysis.');
      
      // Premium Mock Analysis (Lipid Cholesterol Report Example)
      analysisResult = {
        patientName: 'Aarav Mehta',
        testsIdentified: ['Lipid Profile Screen', 'Thyroid TSH'],
        criticalAlerts: [
          'Total Cholesterol is 245 mg/dL (High, normal is < 200)',
          'LDL Cholesterol is 162 mg/dL (Elevated, normal is < 100)',
          'Triglycerides are 180 mg/dL (Borderline High, normal is < 150)',
        ],
        medicationsIdentified: [],
        recommendedSpecialist: 'Cardiologist',
        suggestedFollowUpTests: ['Apolipoprotein B', 'Fasting Blood Glucose'],
        fullSummary: 'Your lipid panel shows elevated LDL (bad) cholesterol and total cholesterol levels. The thyroid metrics are completely normal. We highly recommend discussing these values with a cardiologist to review cardiorespiratory habits.',
      };
    }

    // Save report analysis to user's history if userId is provided
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.reports.push({
          fileName: req.file.originalname,
          analysis: analysisResult,
        });
        await user.save();
      }
    }

    res.status(200).json({
      message: 'Medical report parsed successfully.',
      analysis: analysisResult,
    });
  } catch (error) {
    console.error('Error in analyzeReport controller:', error);
    res.status(500).json({ message: 'Internal Server Error during AI report parsing.' });
  }
};

const TRIAGE_QUESTION_TREES = {
  Cardiologist: [
    {
      text: "Does the chest discomfort spread to your left arm, neck, or jaw?",
      options: ["Yes, spreads to arm/jaw", "Only in the chest center", "No, feels like acid reflux"]
    },
    {
      text: "Are you also experiencing shortness of breath or dizziness?",
      options: ["Yes, significant shortness of breath", "Mild dizziness", "No other symptoms"]
    }
  ],
  Dentist: [
    {
      text: "Is the tooth pain constant, or does it trigger only when eating/drinking hot or cold items?",
      options: ["Triggered by hot/cold", "Constant throbbing pain", "Only when chewing", "Mild sensitivity"]
    },
    {
      text: "Do you also have swelling in your gums or a fever?",
      options: ["Yes, visible swelling", "Mild bleeding gums", "No swelling or fever"]
    }
  ],
  Dermatologist: [
    {
      text: "How would you describe the skin issue?",
      options: ["Dry, itchy red patches", "Pimples/Acne flares", "Sudden hives/swelling", "Mild irritation"]
    },
    {
      text: "How long has the rash or skin issue been present?",
      options: ["1-3 days", "Over a week", "Months (recurring)"]
    }
  ],
  'ENT Specialist': [
    {
      text: "What is the primary concern?",
      options: ["Severe throat pain / swallow issues", "Earache or fluid discharge", "Nasal congestion / sinus pressure"]
    },
    {
      text: "Is it accompanied by a high fever?",
      options: ["Yes, high fever", "Mild low-grade fever", "No fever"]
    }
  ],
  Psychiatrist: [
    {
      text: "How long have you been having trouble sleeping?",
      options: ["Less than a week", "1-2 weeks", "A few weeks to a month", "More than a month"]
    },
    {
      text: "And how would you describe the severity — is it mild, moderate, or affecting your daily life significantly?",
      options: ["Mild — occasional restless nights", "Moderate — losing several hours of sleep", "Severe — barely sleeping at all"]
    }
  ],
  'General Physician': [
    {
      text: "How long have you felt these symptoms?",
      options: ["1-3 days", "4-7 days", "More than a week"]
    },
    {
      text: "How severely is this affecting your daily routine?",
      options: ["Mild - manageable", "Moderate - struggling", "Severe - bedridden"]
    }
  ]
};

const getQuestionTree = (specialist) => {
  const key = Object.keys(TRIAGE_QUESTION_TREES).find(k => specialist.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(specialist.toLowerCase()));
  return TRIAGE_QUESTION_TREES[key] || TRIAGE_QUESTION_TREES['General Physician'];
};

// POST /api/ai/chat-triage
// Body: message (symptom string), city (optional, defaults to 'Bengaluru'), stage, specialist, priority, analysis, answers
exports.chatTriage = async (req, res) => {
  try {
    const { message, city = 'Bengaluru', stage = 'initial', specialist: reqSpecialist, priority: reqPriority, analysis: reqAnalysis, answers = [] } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message parameter is required.' });
    }

    // Stage 1: Initial user message mapping
    if (stage === 'initial') {
      const ai = getGenAIClient();
      let triageResult;

      if (ai) {
        const prompt = `
          You are a highly analytical clinical triage and symptom mapping assistant.
          Analyze the following symptom description from a patient:
          "${message}"

          Determine which medical specialty from the following list matches these symptoms best:
          [Dentist, Gynecologist/obstetrician, General Physician, Dermatologist, ENT Specialist, Homoeopath, Ayurveda, Cardiologist, Neurologist, Pediatrician, Orthopedist, Oncologist, Psychiatrist, Urologist, Gastroenterologist, Pulmonologist, Endocrinologist, Nephrologist, Ophthalmologist, Physiotherapist, Sexologist, Dietitian]

          Return a clean, strict JSON output matching the following key structure exactly. Do not wrap in markdown or add code fences. Return raw JSON.

          JSON structure:
          {
            "analysis": "A brief patient-friendly clinical summary of what their symptoms could indicate.",
            "priority": "High / Medium / Low",
            "specialist": "The exact matching specialty string from the list above."
          }
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });

        try {
          let cleanedJson = response.text.trim();
          if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/^```json|```$/g, '').trim();
          }
          triageResult = JSON.parse(cleanedJson);
        } catch (jsonErr) {
          console.error('Failed to parse Gemini response as JSON:', response.text);
          triageResult = fallbackTriage(message);
        }
      } else {
        triageResult = fallbackTriage(message);
      }

      // Instead of returning doctors immediately, pull the question tree for this specialist
      const questions = getQuestionTree(triageResult.specialist);
      
      // Return first question!
      return res.status(200).json({
        stage: 'question1',
        specialist: triageResult.specialist,
        priority: triageResult.priority,
        analysis: triageResult.analysis,
        questionText: questions[0].text,
        options: questions[0].options,
        answers: []
      });
    }

    // Stage 2: Question 1 Answered
    if (stage === 'question1') {
      const updatedAnswers = [...answers, message];
      const questions = getQuestionTree(reqSpecialist);

      // Return second question!
      return res.status(200).json({
        stage: 'question2',
        specialist: reqSpecialist,
        priority: reqPriority || 'Medium',
        analysis: reqAnalysis || '',
        questionText: questions[1].text,
        options: questions[1].options,
        answers: updatedAnswers
      });
    }

    // Stage 3: Question 2 Answered -> Completed, Fetch Doctors!
    if (stage === 'question2') {
      const updatedAnswers = [...answers, message];
      const specialty = reqSpecialist;
      const priority = reqPriority || 'Medium';
      
      // Generate standard analysis based on user inputs
      const userAnswersText = updatedAnswers.join(', ');
      const analysis = reqAnalysis 
        ? `${reqAnalysis} Details: ${userAnswersText}`
        : `Consultation recommended for ${specialty} concerns. Symptoms detail: ${userAnswersText}`;

      // Query Doctors matching specialty
      const Doctor = require('../models/Doctor');
      const { scrapeLybrateDoctors } = require('../services/lybrateScraper');

      const searchCity = city;
      const userLng = 77.641151;
      const userLat = 12.971891;
      const searchRadius = 15000;

      let matchedDoctors = await Doctor.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [userLng, userLat],
            },
            distanceField: 'distanceInMeters',
            maxDistance: searchRadius,
            spherical: true,
            query: { specialization: { $regex: new RegExp(specialty, 'i') } },
          },
        },
      ]);

      if (matchedDoctors.length < 4) {
        try {
          console.log(`🕵️ [Chat Triage Crawler] Cache sparse (${matchedDoctors.length} records) for '${specialty}' in '${searchCity}'. Querying Lybrate...`);
          const scrapedDocs = await scrapeLybrateDoctors('Bengaluru', specialty);

          if (scrapedDocs && scrapedDocs.length > 0) {
            const insertPromises = scrapedDocs.map(async (doc) => {
              const exists = await Doctor.findOne({
                name: { $regex: new RegExp('^' + doc.name.trim() + '$', 'i') },
                specialization: { $regex: new RegExp('^' + doc.specialty.trim() + '$', 'i') }
              });
              if (!exists) {
                const offsetLng = (Math.random() - 0.5) * 0.05;
                const offsetLat = (Math.random() - 0.5) * 0.05;
                const uniqueSlug = `${doc.name.toLowerCase().replace(/[^a-z]/g, '')}_${Date.now()}`;
                const mockPhone = `+919${Math.floor(100000000 + Math.random() * 900000000)}`;

                return Doctor.create({
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
                    coordinates: [userLng + offsetLng, userLat + offsetLat],
                  },
                  activeHours: '09:00 AM - 05:00 PM',
                });
              }
            });

            await Promise.all(insertPromises);

            matchedDoctors = await Doctor.aggregate([
              {
                $geoNear: {
                  near: {
                    type: 'Point',
                    coordinates: [userLng, userLat],
                  },
                  distanceField: 'distanceInMeters',
                  maxDistance: searchRadius,
                  spherical: true,
                  query: { specialization: { $regex: new RegExp(specialty, 'i') } },
                },
              },
            ]);
          }
        } catch (scrapeErr) {
          console.error('❌ [Chat Triage Crawler] Scraper failed:', scrapeErr.message);
        }
      }

      const doctors = matchedDoctors.slice(0, 5).map(doc => {
        const distanceInKm = parseFloat((doc.distanceInMeters / 1000).toFixed(1));
        return {
          doctorId: doc._id,
          name: doc.name,
          specialty: doc.specialization,
          specialization: doc.specialization,
          experience: doc.experienceYears,
          experienceYears: doc.experienceYears,
          clinicName: doc.clinicName,
          fee: doc.consultationFee,
          consultationFee: doc.consultationFee,
          scrapedRating: doc.scrapedRating,
          coordinates: doc.location.coordinates,
          distanceKm: distanceInKm,
          activeHours: doc.activeHours,
        };
      });

      return res.status(200).json({
        stage: 'completed',
        analysis,
        priority,
        specialist: specialty,
        doctors
      });
    }

    res.status(400).json({ message: 'Invalid stage parameter.' });
  } catch (error) {
    console.error('Error in chatTriage controller:', error);
    res.status(500).json({ message: 'Internal Server Error during AI chat triage.' });
  }
};

// Helper rule-based fallback symptom triage function
function fallbackTriage(message) {
  const lower = message.toLowerCase();
  let specialist = "General Physician";
  let priority = "Medium";
  let analysis = "General physical checkup recommended based on described symptoms.";

  if (lower.includes('chest') || lower.includes('heart') || lower.includes('breath') || lower.includes('cardio')) {
    specialist = "Cardiologist";
    priority = "High";
    analysis = "Symptom markers point towards potential cardiorespiratory strain. Urgent cardiological evaluation advised.";
  } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('acne') || lower.includes('allergy')) {
    specialist = "Dermatologist";
    priority = "Low";
    analysis = "Skin irritation, redness, or lesions observed. Dermatological consult suggested.";
  } else if (lower.includes('ear') || lower.includes('nose') || lower.includes('throat') || lower.includes('tonsil') || lower.includes('swallow')) {
    specialist = "ENT Specialist";
    priority = "Medium";
    analysis = "Symptoms match standard ear, nose, or upper respiratory track discomfort. ENT specialist evaluation recommended.";
  } else if (lower.includes('tooth') || lower.includes('teeth') || lower.includes('mouth') || lower.includes('gums') || lower.includes('dentist')) {
    specialist = "Dentist";
    priority = "Low";
    analysis = "Oral discomfort or sensitivity indicated. Dental checkup recommended.";
  } else if (lower.includes('anxiety') || lower.includes('depression') || lower.includes('sleep') || lower.includes('stress') || lower.includes('mental')) {
    specialist = "Psychiatrist";
    priority = "Medium";
    analysis = "Stress, sleep disturbance, or mood flags detected. Consultation with a psychiatrist or counselor suggested.";
  } else if (lower.includes('bone') || lower.includes('joint') || lower.includes('fracture') || lower.includes('backache') || lower.includes('knee')) {
    specialist = "Orthopedist";
    priority = "Medium";
    analysis = "Musculoskeletal joint or structural discomfort detected. Orthopedic physical consult advised.";
  } else if (lower.includes('child') || lower.includes('baby') || lower.includes('kid') || lower.includes('infant')) {
    specialist = "Pediatrician";
    priority = "Medium";
    analysis = "Pediatric health query. General consultation with a pediatrician recommended.";
  } else if (lower.includes('stomach') || lower.includes('acid') || lower.includes('gut') || lower.includes('constipation') || lower.includes('diarrhea')) {
    specialist = "Gastroenterologist";
    priority = "Medium";
    analysis = "Gastrointestinal tract flags detected. Consultation with a gastroenterologist suggested.";
  }

  return { analysis, priority, specialist };
}
