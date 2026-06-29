const Fuse = require("fuse.js");
const { LYBRATE_SPECIALTIES } = require("./specialities.js");
const redisClient = require("../config/redisClient.js");
const { mapSpecialtyWithGemini } = require("../services/geminiService.js");

const fuse = new Fuse(LYBRATE_SPECIALTIES, {
  includeScore: true,
  threshold: 0.3
});

const FALLBACK_MAP = {
  "allergist": ["Dermatologist", "General Physician"],
  "immunologist": ["Dermatologist", "General Physician"],
  "gynaecologist/obstetrician": ["Gynecologist", "Obstetrician"],
  "gynecologist/obstetrician": ["Gynecologist", "Obstetrician"],
  "gynae": ["Gynecologist"],
  "gynec": ["Gynecologist"],
  "physician": ["General Physician"],
  "surgeon": ["General Surgeon"],
  "urology": ["Urologist"],
  "cardiology": ["Cardiologist"],
  "neurology": ["Neurologist"],
  "dermatology": ["Dermatologist"],
  "orthopedics": ["Orthopedic Surgeon"]
};

const resolveSpecialty = async (userInput) => {
  if (!userInput) return ["General Physician"];

  const trimmedInput = userInput.trim();
  const lowerInput = trimmedInput.toLowerCase();

  // 1. Exact case-insensitive match check
  const exactMatch = LYBRATE_SPECIALTIES.find(
    s => s.toLowerCase() === lowerInput
  );
  if (exactMatch) {
    return [exactMatch];
  }

  // 2. Fuzzy match check using Fuse.js
  const fuzzy = fuse.search(trimmedInput);
  if (fuzzy.length && fuzzy[0].score <= 0.3) {
    console.log(`🎯 [Specialty Resolver] Fuzzy matched "${trimmedInput}" to whitelisted "${fuzzy[0].item}" (score: ${fuzzy[0].score})`);
    return [fuzzy[0].item];
  }

  // 3. Fallback Map check (for common aliases or combinations)
  if (FALLBACK_MAP[lowerInput]) {
    console.log(`🗺️ [Specialty Resolver] Fallback mapped "${trimmedInput}" to:`, FALLBACK_MAP[lowerInput]);
    return FALLBACK_MAP[lowerInput];
  }

  // 4. Redis Cache Check
  const redisKey = `specialty:${lowerInput}`;
  try {
    const cached = await redisClient.get(redisKey);
    if (cached) {
      console.log(`💾 [Specialty Resolver] Cache hit for "${trimmedInput}":`, JSON.parse(cached));
      return JSON.parse(cached);
    }
  } catch (cacheErr) {
    console.error('❌ [Specialty Resolver] Redis fetch failed:', cacheErr.message);
  }

  // 5. Gemini API mapping
  console.log(`🧠 [Specialty Resolver] Redis miss. Querying Gemini to map unsupported specialty "${trimmedInput}"...`);
  const geminiResult = await mapSpecialtyWithGemini(trimmedInput);
  
  const finalResult = geminiResult.length > 0 ? geminiResult : ["General Physician"];

  // Cache final resolved list in Redis
  try {
    await redisClient.set(redisKey, JSON.stringify(finalResult));
    console.log(`💾 [Specialty Resolver] Cached mapping for "${trimmedInput}" in Redis.`);
  } catch (cacheErr) {
    console.error('❌ [Specialty Resolver] Redis save failed:', cacheErr.message);
  }

  return finalResult;
};

module.exports = {
  resolveSpecialty
};
