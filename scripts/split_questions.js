import fs from 'fs';

const FILE_PATH = 'public/data/mechEngQuestions.json';
const PROCESSED_FILE_PATH = 'public/data/mechEngQuestions_processed.json';

const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
const questions = JSON.parse(fileData);

const processed = [];
const unprocessed = [];

for (const q of questions) {
  const isProcessed = q.explanation && !q.explanation.includes('Coming soon') && q.explanation.trim() !== '' && q.topic && q.topic !== 'General' && q.difficulty && q.category && q.category !== 'General';
  if (isProcessed) {
    processed.push(q);
  } else {
    unprocessed.push(q);
  }
}

let existingProcessed = [];
if (fs.existsSync(PROCESSED_FILE_PATH)) {
  existingProcessed = JSON.parse(fs.readFileSync(PROCESSED_FILE_PATH, 'utf-8'));
}
const finalProcessed = [...existingProcessed, ...processed];

const map = new Map();
for (const q of finalProcessed) map.set(q.id, q);
const deduplicatedProcessed = Array.from(map.values());

fs.writeFileSync(PROCESSED_FILE_PATH, JSON.stringify(deduplicatedProcessed, null, 2));
fs.writeFileSync(FILE_PATH, JSON.stringify(unprocessed, null, 2));

console.log(`Split complete!`);
console.log(`Processed questions moved to ${PROCESSED_FILE_PATH}: ${deduplicatedProcessed.length}`);
console.log(`Unprocessed questions remaining in ${FILE_PATH}: ${unprocessed.length}`);
