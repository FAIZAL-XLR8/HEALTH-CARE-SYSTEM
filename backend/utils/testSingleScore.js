const { Pinecone } = require('@pinecone-database/pinecone');
const { PineconeStore } = require('@langchain/pinecone');
const { GoogleGenAI } = require('@google/genai');
const { Embeddings } = require('@langchain/core/embeddings');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

class CommonJSGoogleGenAIEmbeddings extends Embeddings {
  constructor(fields) {
    super(fields ?? {});
    this.apiKey = fields?.apiKey || process.env.GEMINI_API_KEY;
    this.model = fields?.model || 'gemini-embedding-2';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey, apiVersion: 'v1' });
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

async function test() {
  const embeddings = new CommonJSGoogleGenAIEmbeddings();
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: 'assist-triage',
  });

  const queries = [
    '1-2 times per week',
    'regular nightfall',
    'regular nightfall 1-2 times per week',
    'Yes, I have other symptoms',
    'itching Yes, I have other symptoms skin rash'
  ];
  
  for (const q of queries) {
    const results = await vectorStore.similaritySearchWithScore(q, 1);
    console.log(`Query: "${q}" -> Top Match: ${results[0][0].metadata.disease} (Score: ${results[0][1]})`);
  }
}
test().catch(console.error);
