import fs from 'fs';
import path from 'path';

const files = [
  'mechEngQuestions.js',
  'quantsQuestions.js',
  'dataInterpretationQuestions.js',
  'dilrQuestions.js',
  'logicalReasoningQuestions.js'
];

const srcDir = './src/data';
const destDir = './public/data';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

for (const file of files) {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, file.replace('.js', '.json'));
  
  console.log(`Exporting ${srcPath} to ${destPath}...`);
  
  let content = fs.readFileSync(srcPath, 'utf8');
  let jsonStr = content.replace(/^\s*export\s+default\s+/, '').trim();
  if (jsonStr.endsWith(';')) {
    jsonStr = jsonStr.slice(0, -1);
  }
  
  // Verify it parses as JSON
  try {
    const data = JSON.parse(jsonStr);
    fs.writeFileSync(destPath, JSON.stringify(data), 'utf8');
    console.log(`Successfully exported ${destPath}. Size: ${fs.statSync(destPath).size} bytes`);
  } catch (err) {
    console.error(`Failed to parse/export ${file}:`, err);
  }
}
