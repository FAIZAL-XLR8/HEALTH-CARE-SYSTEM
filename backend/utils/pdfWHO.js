import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PDF_Path = join(__dirname, 'psoriosis_data_who.pdf');

async function indexDocument()
{
    const loader = new PDFLoader(PDF_Path);
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} raw pages from the PDF.`);

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
    const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'text-embedding-004',
  });
}

indexDocument();