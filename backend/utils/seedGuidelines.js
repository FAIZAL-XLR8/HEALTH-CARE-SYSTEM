import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import readline from 'readline';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import dotenv from 'dotenv';
import { NewGoogleGenAIEmbeddings } from './embeddings.js';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

const CSV_PATH = join(__dirname, '../data/disease_symtoms.csv');
const PRECAUTION_CSV_PATH = join(__dirname, '../data/disease_precaution.csv');

async function getSpecialtyMappingFromGemini(diseases, apiKey) {
  console.log(`🤖 Querying Gemini to map ${diseases.length} diseases to medical specialties...`);
  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
  const allowedSpecialties = [
    'Dentist', 'Gynecologist/obstetrician', 'General Physician', 'Dermatologist', 
    'ENT Specialist', 'Homoeopath', 'Ayurveda', 'Cardiologist', 'Neurologist', 
    'Pediatrician', 'Orthopedist', 'Oncologist', 'Psychiatrist', 'Urologist', 
    'Gastroenterologist', 'Pulmonologist', 'Endocrinologist', 'Nephrologist', 
    'Ophthalmologist', 'Physiotherapist', 'Sexologist', 'Dietitian'
  ];

  const prompt = `
    You are a medical specialty mapping expert.
    Map each disease in the following list to the single most appropriate medical specialty from the allowed specialties list.
    
    Diseases to map:
    ${JSON.stringify(diseases)}

    Allowed Specialties:
    ${JSON.stringify(allowedSpecialties)}

    You MUST respond with a strict, clean JSON object where keys are the exact disease names from the list and values are their corresponding mapped specialty. Do not include markdown code blocks or any other formatting.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  let rawText = response.text.trim();
  if (rawText.startsWith('```')) {
    rawText = rawText.replace(/^```json|```$/g, '').trim();
  }

  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error("❌ Failed to parse Gemini response as JSON mapping. Falling back to default General Physician.", err);
    return {};
  }
}

async function parseSymptomsCsv(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const diseaseMap = {};

  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    
    // Split by comma, clean and remove spaces
    const cols = line.split(',').map(c => c.trim());
    if (cols.length === 0 || !cols[0]) continue;

    const disease = cols[0];
    const symptoms = cols.slice(1)
      .filter(s => s !== '')
      .map(s => s.toLowerCase().replace(/_/g, ' ').trim());

    if (!diseaseMap[disease]) {
      diseaseMap[disease] = new Set();
    }
    symptoms.forEach(s => diseaseMap[disease].add(s));
  }

  return diseaseMap;
}

async function parsePrecautionCsv(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const precautionMap = {};

  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    
    const cols = line.split(',').map(c => c.trim());
    if (cols.length === 0 || !cols[0]) continue;

    const disease = cols[0];
    const precautions = cols.slice(1).filter(p => p !== '');

    precautionMap[disease] = precautions;
  }

  return precautionMap;
}

async function seedGuidelines() {
  try {
    console.log(`📖 Loading symptoms CSV dataset from ${CSV_PATH}...`);
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`Symptoms CSV file does not exist at ${CSV_PATH}`);
    }
    console.log(`📖 Loading precautions CSV dataset from ${PRECAUTION_CSV_PATH}...`);
    if (!fs.existsSync(PRECAUTION_CSV_PATH)) {
      throw new Error(`Precautions CSV file does not exist at ${PRECAUTION_CSV_PATH}`);
    }

    const diseaseMap = await parseSymptomsCsv(CSV_PATH);
    const precautionMap = await parsePrecautionCsv(PRECAUTION_CSV_PATH);
    
    const uniqueDiseases = Object.keys(diseaseMap);
    console.log(`📊 Parsed CSV dataset: Found ${uniqueDiseases.length} unique diseases.`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error("GEMINI_API_KEY is not configured in backend/.env!");
    }

    const specialtyMap = await getSpecialtyMappingFromGemini(uniqueDiseases, apiKey);

    const docs = [];
    let chunkId = 0;

    for (const [disease, symptomSet] of Object.entries(diseaseMap)) {
      const cleanDisease = disease.trim();
      const specialty = specialtyMap[cleanDisease] || 'General Physician';
      const symptomsList = Array.from(symptomSet).join(', ');

      const diseaseKeyMatch = Object.keys(precautionMap).find(k => k.trim().toLowerCase() === cleanDisease.toLowerCase());
      const precautions = diseaseKeyMatch ? precautionMap[diseaseKeyMatch] : [];
      const precautionList = precautions.join(', ');

      const docText = `Disease: ${cleanDisease}
Specialty: ${specialty}
Associated Symptoms: ${symptomsList}
Precautions: ${precautionList}
Clinical Guidelines: If a patient presents with symptoms such as ${symptomsList}, they should be triaged for potential ${cleanDisease}. The recommended medical specialist to consult is a ${specialty}. The patient should be advised to follow these precautions: ${precautionList}.`;

      docs.push({
        pageContent: docText,
        metadata: {
          source: 'disease_symtoms.csv',
          disease: cleanDisease,
          specialty: specialty,
          chunkId: chunkId++
        }
      });
    }

    console.log(`✂️ Generated ${docs.length} structured disease-symptom-precaution guideline documents.`);

    if (docs.length > 0) {
      console.log("\n--- Guideline Chunk Preview ---");
      console.log(docs[0].pageContent);
      console.log("Metadata:", docs[0].metadata);
      console.log("--------------------------------\n");
    }



    // 1. Initialize Google GenAI Embeddings
    const embeddings = new NewGoogleGenAIEmbeddings({
      apiKey: apiKey,
      model: 'gemini-embedding-2',
    });

    // 2. Initialize Pinecone Client
    const indexName = process.env.PINECONE_INDEX_NAME || 'assist';
    console.log(`🌲 Connecting to Pinecone Index: "${indexName}"...`);
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(indexName);

    // 3. Store in Vector Database
    console.log("📤 Uploading embeddings to Pinecone index...");
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex,
      namespace: 'assist-triage',
      maxConcurrency: 3,
    });

    console.log("✅ Symptoms CSV dataset successfully chunked, embedded and indexed in Pinecone!");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message || error);
    process.exit(1);
  }
}

seedGuidelines();
