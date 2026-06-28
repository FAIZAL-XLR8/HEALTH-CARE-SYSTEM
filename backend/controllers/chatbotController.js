const { GoogleGenAI } = require('@google/genai');
const { Pinecone } = require('@pinecone-database/pinecone');
const { PineconeStore } = require('@langchain/pinecone');
const { Embeddings } = require('@langchain/core/embeddings');
const Doctor = require('../models/Doctor');
const { scrapeLybrateDoctors } = require('../services/lybrateScraper');

// CommonJS Embeddings Class (to bypass ESM interop issues)
class CommonJSGoogleGenAIEmbeddings extends Embeddings {
  constructor(fields) {
    super(fields ?? {});
    this.apiKey = fields?.apiKey || process.env.GEMINI_API_KEY;
    this.model = fields?.model || "gemini-embedding-2";
    this.ai = new GoogleGenAI({ apiKey: this.apiKey, apiVersion: 'v1' });
  }

  async embedDocuments(documents) {
    const response = await this.ai.models.embedContent({
      model: this.model,
      contents: documents,
      config: { outputDimensionality: 768 }
    });
    return response.embeddings.map(e => e.values);
  }

  async embedQuery(document) {
    const response = await this.ai.models.embedContent({
      model: this.model,
      contents: document,
      config: { outputDimensionality: 768 }
    });
    return response.embeddings[0].values;
  }
}

// Initialize Gemini Client
const getGenAIClient = () => {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1beta' });
  }
  return null;
};

// Retrieve context from Pinecone
async function retrieveGuidelinesContext(userQuery) {
  let context = "";
  let ragUsed = false;

  try {
    const pineconeIndexName = process.env.PINECONE_INDEX_NAME;
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (
      pineconeIndexName &&
      pineconeIndexName !== 'YOUR_PINECONE_INDEX_NAME_HERE' &&
      pineconeApiKey &&
      pineconeApiKey !== 'YOUR_PINECONE_API_KEY_HERE' &&
      geminiApiKey &&
      geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE'
    ) {
      console.log(`🔍 [RAG] Attempting vector retrieval from Pinecone index "${pineconeIndexName}"...`);
      const embeddings = new CommonJSGoogleGenAIEmbeddings();
      const pinecone = new Pinecone({ apiKey: pineconeApiKey });
      const pineconeIndex = pinecone.Index(pineconeIndexName);
      
      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace: 'assist-triage',
      });
      const searchResultsWithScore = await vectorStore.similaritySearchWithScore(userQuery, 4);
      // Filter by similarity score threshold to only count relevant documents
      const relevantResults = searchResultsWithScore.filter(([doc, score]) => score >= 0.60);

      if (relevantResults && relevantResults.length > 0) {
        console.log(`[RAG ACTIVE] Retrieved ${relevantResults.length} chunks from Pinecone.`);
        console.log("=== RETRIEVED DOCUMENTS ===");
        relevantResults.forEach(([doc, score], i) => {
          console.log(`Document ${i + 1}:`);
          console.log(doc.pageContent);
        });

        context = relevantResults.map(([doc, score]) => doc.pageContent).join("\n\n");
        ragUsed = true;
        return {
          context,
          ragUsed
        };
      }
    }
  } catch (err) {
    console.error("⚠️ [RAG] Pinecone retrieval failed:", err.message || err);
  }

  console.log("[RAG INACTIVE] Using Gemini without retrieval.");
  return {
    context: "",
    ragUsed: false
  };
}

// POST /api/ai/chatbot
exports.handleChatbotMessage = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Conversational history is required." });
    }

    // Gather all symptoms described by the user so far to query RAG,
    // avoiding false-positive RAG activations from standalone choices (e.g. "Yes", "1-2 times per week")
    const userMessages = messages.filter(msg => msg.sender === 'user').map(msg => msg.text);
    const combinedQuery = userMessages.join(" ");
    const ai = getGenAIClient();

    if (!ai) {
      console.error("❌ Gemini API Key not configured.");
      return res.status(500).json({ message: "Gemini API key is not configured." });
    }

    // 1. Retrieve RAG Context
    const { context, ragUsed } = await retrieveGuidelinesContext(combinedQuery);

    // 2. Format chat history for Gemini SDK
    const formattedHistory = [];
    for (const msg of messages) {
      if (msg.type === 'welcome') continue; // Skip welcome message
      formattedHistory.push({
        role: msg.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    }

    // 3. System Instructions with RAG clinical rules
    const systemInstruction = `
      You are Apollo Assist, a clinical triage and medical recommendation AI assistant.
      Your task is to analyze the conversation and evaluate the patient's symptoms.
      
      ${ragUsed ? `Below is the reference dataset retrieved from the database mapping diseases, specialties, associated symptoms, and precautions:
      ${context}

      Instructions:
      1. Review the symptoms described by the patient. Compare them against the "Associated Symptoms" of diseases in the reference dataset.
      2. Ask clear, empathetic, and targeted follow-up questions to clarify their symptoms, duration, and severity to narrow down the possible diseases.
      3. Ask only ONE question at a time to keep the patient engaged and not overwhelmed.
      4. Once you have enough context to confidently identify the matching disease and its corresponding medical specialty, you must set the conversation as complete.
      5. To help the patient answer your follow-up questions without having to type manually, you must provide a list of dynamic choice options (like yes/no, duration ranges, or symptom checklists) suitable for the question.
      6. When the conversation is complete (isComplete is true), you MUST formulate the followUpInstructions (Advice) using the specific "Precautions" listed in the reference dataset for the matched disease. Make sure to list these precautions clearly to advise the patient.
      7. You MUST respond with a raw JSON object matching the following structure. Do not output markdown code blocks, do not write any additional text, just the raw JSON.` : `
      Instructions:
      1. Review the symptoms described by the patient.
      2. Ask clear, empathetic, and targeted follow-up questions to clarify their symptoms, duration, and severity.
      3. Ask only ONE question at a time to keep the patient engaged and not overwhelmed.
      4. Once you have enough context to confidently identify the possible disease and its corresponding medical specialty, you must set the conversation as complete.
      5. To help the patient answer your follow-up questions without having to type manually, you must provide a list of dynamic choice options (like yes/no, duration ranges, or symptom checklists) suitable for the question.
      6. When the conversation is complete (isComplete is true), formulate clinical advice under followUpInstructions.
      7. You MUST respond with a raw JSON object matching the following structure. Do not output markdown code blocks, do not write any additional text, just the raw JSON.`}

      JSON Response Schema:
      {
        "isComplete": boolean,
        "triageAnalysis": "Clear, patient-friendly summary explaining the potential disease condition. Leave empty if isComplete is false.",
        "priority": "High" | "Medium" | "Low",
        "specialty": "Cardiologist" | "Dermatologist" | "ENT Specialist" | "General Physician" | "Gastroenterologist" | "Orthopedist" | "Neurologist" | "Endocrinologist" | "Pulmonologist" | "Urologist" | "Dentist" | "Gynecologist/obstetrician",
        "followUpInstructions": "Empathic clinical advice on what the patient should do next. Leave empty if isComplete is false.",
        "text": "The follow-up question to ask the patient if the conversation is NOT complete. Leave empty if isComplete is true.",
        "options": ["Option A", "Option B", "Option C", "None of these"], // List of choice options for the user to answer the follow-up question. Provide 3-5 appropriate short options. Leave empty if isComplete is true.
        "optionsType": "single" | "multi" // Whether the options are single-choice (one can be selected to send immediately) or multi-choice (multiple checkboxes with confirm button). Leave empty if isComplete is true.
      }
    `;

    console.log("🧠 Querying Gemini model (gemini-3.1-flash-lite) for chatbot triage...");
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: formattedHistory,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    let rawText = response.text.trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```json|```$/g, '').trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("❌ Failed to parse Gemini response as JSON:", rawText);
      return res.status(500).json({ message: "AI response formatting error." });
    }

    // 4. If conversation complete, search & recommend doctors
    if (parsedResult.isComplete && parsedResult.specialty) {
      console.log(`🩺 Chatbot complete! Recommending doctors for specialty: "${parsedResult.specialty}"...`);
      
      // Map specialty to scraper-supported naming convention
      let formattedSpecialty = parsedResult.specialty;
      if (formattedSpecialty === 'ENT Specialist') {
        formattedSpecialty = 'ENT';
      }

      const recommendedDoctors = await getRecommendedDoctors(formattedSpecialty);
      return res.status(200).json({
        isComplete: true,
        triageAnalysis: parsedResult.triageAnalysis,
        priority: parsedResult.priority,
        specialty: parsedResult.specialty,
        followUpInstructions: parsedResult.followUpInstructions,
        text: `Based on your symptoms, we recommend consulting a ${parsedResult.specialty}. Here is a list of nearby doctors available in Bangalore.`,
        doctors: recommendedDoctors,
        isRagUsed: ragUsed
      });
    }

    // 5. If not complete, send next follow-up question
    return res.status(200).json({
      isComplete: false,
      text: parsedResult.text,
      options: parsedResult.options || [],
      optionsType: parsedResult.optionsType || 'single',
      isRagUsed: ragUsed
    });

  } catch (error) {
    console.error("❌ Chatbot controller error:", error);
    res.status(500).json({ message: "Internal server error during chatbot process." });
  }
};

// Query doctors from MongoDB + scrape Lybrate on sparse records (Defaulting to Bangalore coords)
async function getRecommendedDoctors(specialty) {
  const userLng = 77.641151; // central Bangalore
  const userLat = 12.971891;
  const searchRadius = 10000; // 10km radius

  try {
    let matchedDoctors = await Doctor.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [userLng, userLat] },
          distanceField: 'distanceInMeters',
          maxDistance: searchRadius,
          spherical: true,
          query: { specialization: { $regex: new RegExp('\\b' + specialty.trim() + '\\b', 'i') } },
        },
      },
    ]);

    if (matchedDoctors.length < 3) {
      console.log(`🕵️ [Chatbot Doctor Crawler] Sparse db records (${matchedDoctors.length}). Launching Lybrate crawler...`);
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
              googleRating: doc.rating || 4.5,
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

        // Re-query database
        matchedDoctors = await Doctor.aggregate([
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [userLng, userLat] },
              distanceField: 'distanceInMeters',
              maxDistance: searchRadius,
              spherical: true,
              query: { specialization: { $regex: new RegExp('\\b' + specialty.trim() + '\\b', 'i') } },
            },
          },
        ]);
      }
    }

    return matchedDoctors.map(doc => {
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
        googleRating: doc.googleRating,
        scrapedRating: doc.scrapedRating,
        coordinates: doc.location.coordinates,
        distanceKm: distanceInKm,
        activeHours: doc.activeHours,
      };
    });
  } catch (error) {
    console.error("❌ getRecommendedDoctors error:", error.message);
    return [];
  }
}
