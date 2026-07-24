import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../public/data/mechEngQuestions.json');
const OUTPUT_DIR = path.join(__dirname, '../public/data/mech_topics');

// Helper to convert topic names to safe filenames
function getFileName(topic) {
  if (!topic) return 'uncategorized.json';
  return topic.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_') + '.json';
}

function splitQuestions() {
  console.log('Loading full dataset...');
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Loaded ${data.length} questions.`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const grouped = {};
  
  // Group questions by topic
  for (const q of data) {
    const topic = q.topic || q.subject || 'Uncategorized';
    if (!grouped[topic]) {
      grouped[topic] = [];
    }
    grouped[topic].push(q);
  }

  const index = [];

  // Write each topic to a separate file
  for (const [topic, questions] of Object.entries(grouped)) {
    const fileName = getFileName(topic);
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
    console.log(`Saved ${questions.length} questions to ${fileName}`);
    
    index.push({
      topic,
      fileName,
      count: questions.length
    });
  }

  // Write an index file for easy mapping on the frontend
  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`\\n✅ Split complete! Index saved to index.json`);
}

splitQuestions();
