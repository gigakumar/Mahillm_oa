import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeDILR() {
  const INPUT = path.join(__dirname, '../public/data/cat_dilr_questions.json');
  const OUTPUT = path.join(__dirname, '../public/data/normalized_dilr.json');
  
  if (!fs.existsSync(INPUT)) {
    console.log(`File not found: ${INPUT}`);
    return;
  }
  
  const rawData = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  const normalized = rawData.map((q, idx) => {
    // find correct index
    const correctIndex = q.options.findIndex(opt => opt === q.correct_answer);
    
    return {
      id: `dilr_${crypto.randomBytes(4).toString('hex')}_${idx}`,
      question: q.question,
      options: q.options,
      correct: correctIndex !== -1 ? correctIndex : 0,
      explanation: q.explanation,
      contextHtml: `<div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-left: 4px solid var(--accent); margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap;">${q.passage}</div>`,
      difficulty: q.difficulty ? q.difficulty.toUpperCase() : 'HIGH',
      topic: q.topic || 'DILR Puzzle',
      category: 'DILR',
      type: 'MCQ'
    };
  });
  
  fs.writeFileSync(OUTPUT, JSON.stringify(normalized, null, 2));
  console.log(`Normalized ${normalized.length} DILR questions -> ${OUTPUT}`);
}

normalizeDILR();
