import fs from 'fs';
import path from 'path';

const files = [
  'mechEngQuestions.js',
  'quantsQuestions.js',
  'dataInterpretationQuestions.js',
  'dilrQuestions.js',
  'logicalReasoningQuestions.js'
];

const dataDir = './src/data';
const allowedKeys = new Set([
  'id', 'question', 'options', 'correct', 'explanation', 'contextHtml', 'difficulty', 'topic', 'category', 'type'
]);

for (const file of files) {
  const filePath = path.join(dataDir, file);
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  // Strip "export default" to parse as JSON
  let jsonStr = content.replace(/^\s*export\s+default\s+/, '').trim();
  // Strip trailing semicolon if exists
  if (jsonStr.endsWith(';')) {
    jsonStr = jsonStr.slice(0, -1);
  }
  
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (err) {
    // If it's JS (not strict JSON), we can use eval or dynamic import.
    // Since it's a node script, we can just use dynamic import.
    console.log(`Parsing as JSON failed for ${file}, will use dynamic import.`);
    continue;
  }

  const cleanedData = data.map(q => {
    const cleaned = {};
    for (const key of allowedKeys) {
      if (q[key] !== undefined) {
        cleaned[key] = q[key];
      }
    }
    return cleaned;
  });

  const outputContent = `export default ${JSON.stringify(cleanedData, null, 2)};\n`;
  fs.writeFileSync(filePath, outputContent, 'utf8');
  console.log(`Cleaned ${filePath}.`);
}
