import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import dotenv from 'dotenv';
import { NewGoogleGenAIEmbeddings } from './embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

const PDF_Path = join(__dirname, 'psoriosis_data_who.pdf');

async function indexDocument()
{
    //load the pdf
    const loader = new PDFLoader(PDF_Path);
    const docs = await loader.load();

    //split the pdf into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    
    const chunkedDocs = await textSplitter.splitDocuments(docs);
    console.log(`Successfully split into ${chunkedDocs.length} chunks.`);
    
    if (chunkedDocs.length > 0) {
        console.log("\n--- First Chunk Content ---");
        console.log(chunkedDocs[0].pageContent);
        console.log("Metadata:", chunkedDocs[0].metadata);
    }
    
    //make embeddings of vector
    const embeddings = new NewGoogleGenAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-embedding-001',
    });
    
    // configure database vector
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    
    //add to vector database
    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
      pineconeIndex,
      namespace: 'medical-docs',
      maxConcurrency : 5,
    });
    console.log('Data stored. PDF content indexed successfully in Pinecone!');
}

indexDocument();