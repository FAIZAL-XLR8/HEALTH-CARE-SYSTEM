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

  const query = 'regular nightfall 1-2 times per week';
  const results = await vectorStore.similaritySearchWithScore(query, 4);
  console.log('\nQuery:', query);
  results.forEach(([doc, score], i) => {
    console.log(`  Match ${i+1}: ${doc.metadata.disease} - Score: ${score}`);
  });
}
test().catch(console.error);
