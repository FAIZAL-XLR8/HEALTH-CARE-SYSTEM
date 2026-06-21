import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function clearNamespace() {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || 'assist';
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey || apiKey === 'YOUR_PINECONE_API_KEY_HERE') {
      throw new Error("PINECONE_API_KEY is not configured in backend/.env!");
    }

    console.log(`🌲 Connecting to Pinecone Index: "${indexName}" to clear namespace "assist-triage"...`);
    const pinecone = new Pinecone({ apiKey });
    const index = pinecone.Index(indexName);

    // Delete all vectors in the namespace
    await index.namespace('assist-triage').deleteAll();
    console.log(`✅ Successfully deleted all vectors in Pinecone namespace "assist-triage"!`);
  } catch (error) {
    console.error("❌ Failed to clear namespace:", error.message || error);
    process.exit(1);
  }
}

clearNamespace();
