import readlineSync from 'readline-sync';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { GoogleGenAI } from '@google/genai';
import { NewGoogleGenAIEmbeddings } from './embeddings.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });
async function main() {
  console.log("Connecting to Pinecone index...");
  
  try {
    // 1. Initialize embeddings
    const embeddings = new NewGoogleGenAIEmbeddings();

    // 2. Initialize Pinecone index
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    // 3. Connect to the PineconeStore
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: 'medical-docs',
    });

    // 4. Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1beta' });

    console.log("✅ Vector DB connected successfully!");

    // Conversation history array
    const History = [];

    // Loop to continuously query the user
    while (true) {
      const question = readlineSync.question('\n❓ Ask a medical question (or type "exit" to quit): ');
      
      if (question.toLowerCase() === 'exit') {
        console.log('Goodbye!');
        break;
      }
      
      if (!question.trim()) continue;

      console.log(`🔍 Searching vector database for context...`);

      // Perform Similarity Search (retrieve top 3 matches)
      const results = await vectorStore.similaritySearch(question, 3);
      
      // Combine retrieved contents into a single context string
      const context = results.map(doc => doc.pageContent).join("\n\n");

      // Push user question to history
      History.push({
        role: 'user',
        parts: [{ text: question }]
      });

      console.log(`🧠 Querying Gemini LLM with retrieved context...`);

      // Call Gemini model (gemini-3.1-flash-lite)
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: History,
        config: {
          systemInstruction: `You have to behave like a Clinical and Medical Guidelines Expert.
You will be given a context of relevant medical information and a user question.
Your task is to answer the user's question based ONLY on the provided context.
If the answer is not in the context, you must say "I could not find the answer in the provided document."
Keep your answers clear, concise, and educational.
      
Context: ${context}
`,
        },
      });

      // Push model response to history for conversation memory
      History.push({
        role: 'model',
        parts: [{ text: response.text }]
      });

      console.log("\n🤖 --- Gemini AI Response ---");
      console.log(response.text);
      console.log("----------------------------");
    }
  } catch (err) {
    console.error("❌ DB Query or LLM call failed:", err);
  }
}

main();
