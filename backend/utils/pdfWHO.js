import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PDF_Path = join(__dirname, 'psoriosis_data_who.pdf');

async function indexDocument()
{
    const loader = new PDFLoader(PDF_Path);
    const docs = await loader.load();
    console.log(docs);
}

indexDocument();