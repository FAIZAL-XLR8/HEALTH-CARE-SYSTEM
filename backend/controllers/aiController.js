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

// POST /api/ai/lifestyle
// Body: sleepingHours, sleepTime, eatingTimes (breakfast, lunch, dinner), activityLevel, location, reportSummary (optional)
exports.getLifestyleRecommendations = async (req, res) => {
  try {
    const { sleepingHours, sleepTime, dinnerTime, breakfastTime, activityLevel, location, reportSummary } = req.body;

    const ai = getGenAIClient();
    let recommendation;

    if (ai) {
      const prompt = `
        You are a highly analytical and empathetic preventive medicine and nutrition consultant.
        Review the following patient daily schedule:
        * Sleeping Hours: ${sleepingHours} hours, bedtime at ${sleepTime}
        * Breakfast: ${breakfastTime}
        * Dinner: ${dinnerTime}
        * Daily Activity: ${activityLevel}
        * Location: ${location || 'Bengaluru'}
        ${reportSummary ? `* Patient Laboratory Alerts: ${JSON.stringify(reportSummary)}` : ''}

        Formulate a personalized daily routine plan and lifestyle changes.
        Return the result as a strict, clean JSON output matching the following key structure exactly.
        Do not add any markdown, code blocks, or leading text, return only raw JSON.

        JSON structure:
        {
          "dailySchedule": [
            { "time": "Time slot, e.g. 07:00 AM", "activity": "Action, e.g. Hydrate and stretch", "rationale": "Why" }
          ],
          "dietaryAdjustments": ["List of foods to eat or restrict based on active location and reports"],
          "sleepHygieneTips": ["Custom sleep improvement suggestions based on their sleep hours"],
          "activityTips": ["Custom exercise tips tailored to their activity level"],
          "hydrationGoal": "E.g., 3.0 Litres daily based on schedule"
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
        recommendation = JSON.parse(cleanedJson);
      } catch (jsonErr) {
        console.error('Failed to parse Gemini response as JSON:', response.text);
        res.status(500).json({ message: 'Error formatting AI lifestyle recommendations.' });
        return;
      }
    } else {
      console.log('Gemini API key is not configured. Falling back to high-fidelity mock lifestyle wizard recommendations.');

      // Premium Mock Lifestyle Response
      recommendation = {
        dailySchedule: [
          { time: '07:30 AM', activity: 'Hydration & Sunrise Walk', rationale: 'Boost cortisol naturally, kickstarting digestion.' },
          { time: '08:45 AM', activity: 'Breakfast (High Protein/Fiber)', rationale: 'Oatmeal with chia seeds. Excellent to bind bile acids and lower LDL cholesterol.' },
          { time: '02:00 PM', activity: 'Standard Lunch', rationale: 'Maintain consistent insulin curves.' },
          { time: '07:30 PM', activity: 'Early Dinner (Light)', rationale: 'Dinner at 7:30 PM (shifted 3 hours earlier from 10:30 PM) is critical to prevent nighttime lipid synthesis and improve sleep quality.' },
          { time: '10:00 PM', activity: 'Digital Detox & Bedtime preparation', rationale: 'Ensure 7.5 hours of solid rest to lower systemic inflammation.' }
        ],
        dietaryAdjustments: [
          'Incorporate Bengaluru locally sourced fresh foods: ragi ruda, green leafy spinach (soppu), and drumsticks.',
          'Drastically restrict late-night heavy carb dinners.',
          'Replace refined sunflower oil with cold-pressed mustard or olive oil to manage high LDL markers.'
        ],
        sleepHygieneTips: [
          'Since you currently get only 6 hours of sleep, target a consistent bedtime of 10:30 PM.',
          'Avoid blue screens at least 45 minutes before sleep to allow natural melatonin secretion.'
        ],
        activityTips: [
          'Given your sedentary lifestyle, start with 20 minutes of moderate walking around your local Bengaluru neighborhood.',
          'Use stairs instead of lifts to slowly build cardiovascular endurance.'
        ],
        hydrationGoal: '3.0 Litres of water daily, spread out evenly with dynamic reminders.',
      };
    }

    res.status(200).json(recommendation);
  } catch (error) {
    console.error('Error in getLifestyleRecommendations controller:', error);
    res.status(500).json({ message: 'Internal Server Error during lifestyle personalization.' });
  }
};
