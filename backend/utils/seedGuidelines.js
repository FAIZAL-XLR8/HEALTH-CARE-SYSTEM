import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import readline from 'readline';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import dotenv from 'dotenv';
import { NewGoogleGenAIEmbeddings } from './embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

const CSV_PATH = join(__dirname, '../data/disease_symtoms.csv');
const PRECAUTION_CSV_PATH = join(__dirname, '../data/disease_precaution.csv');

// Predefined disease mapping to precise specialties (we dynamically scrape from Lybrate for any specialty!)
const diseaseToSpecialty = {
  'Fungal infection': 'Dermatologist',
  'Allergy': 'General Physician',
  'GERD': 'Gastroenterologist',
  'Chronic cholestasis': 'Gastroenterologist',
  'Drug Reaction': 'Dermatologist',
  'Peptic ulcer diseae': 'Gastroenterologist',
  'AIDS': 'General Physician',
  'Diabetes ': 'Endocrinologist',
  'Gastroenteritis': 'Gastroenterologist',
  'Bronchial Asthma': 'Pulmonologist',
  'Hypertension ': 'Cardiologist',
  'Migraine': 'Neurologist',
  'Cervical spondylosis': 'Orthopedist',
  'Paralysis (brain hemorrhage)': 'Neurologist',
  'Jaundice': 'Gastroenterologist',
  'Malaria': 'General Physician',
  'Chicken pox': 'Dermatologist',
  'Dengue': 'General Physician',
  'Typhoid': 'General Physician',
  'hepatitis A': 'Gastroenterologist',
  'Hepatitis B': 'Gastroenterologist',
  'Hepatitis C': 'Gastroenterologist',
  'Hepatitis D': 'Gastroenterologist',
  'Hepatitis E': 'Gastroenterologist',
  'Alcoholic hepatitis': 'Gastroenterologist',
  'Tuberculosis': 'Pulmonologist',
  'Common Cold': 'General Physician',
  'Pneumonia': 'Pulmonologist',
  'Dimorphic hemmorhoids(piles)': 'Gastroenterologist',
  'Heart attack': 'Cardiologist',
  'Varicose veins': 'Dermatologist',
  'Hypothyroidism': 'Endocrinologist',
  'Hyperthyroidism': 'Endocrinologist',
  'Hypoglycemia': 'Endocrinologist',
  'Osteoarthristis': 'Orthopedist',
  'Arthritis': 'Orthopedist',
  '(vertigo) Paroymsal  Positional Vertigo': 'ENT',
  'Acne': 'Dermatologist',
  'Urinary tract infection': 'Urologist',
  'Psoriasis': 'Dermatologist',
  'Impetigo': 'Dermatologist'
};

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

    const docs = [];
    let chunkId = 0;

    for (const [disease, symptomSet] of Object.entries(diseaseMap)) {
      const cleanDisease = disease.trim();
      const specialty = diseaseToSpecialty[disease] || 'General Physician';
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error("GEMINI_API_KEY is not configured in backend/.env!");
    }

    // 1. Initialize Google GenAI Embeddings
    const embeddings = new NewGoogleGenAIEmbeddings({
      apiKey: apiKey,
      model: 'gemini-embedding-001',
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
