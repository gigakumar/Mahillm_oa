import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = 'AIzaSyDw-nrkg4UALyHnnwR8cswQPdod_lRwHa8';
const DATA_FILE = path.join(__dirname, '../public/data/mechEngQuestions.json');

// Number of questions to process per run (for testing/batching)
const BATCH_SIZE = 100;
const DELAY_MS = 2000; // Delay between requests to avoid rate limits

async function generateEnrichmentBatch(questionsBatch) {
  const prompt = `
You are an expert engineering tutor. I will provide you with a list of ${questionsBatch.length} multiple-choice questions. 
For each question, please provide:
1. "equation": The exact mathematical equation resolving the question (e.g., '100 J = 20 J + 80 J' or a key substitution). Keep it concise. If no calculation, provide the core theoretical principle as a concise mathematical or logical statement.
2. "trick": A unique, question-specific exam trick to avoid common pitfalls for this exact question. Do not give generic advice.

Here are the questions:
${questionsBatch.map((q, idx) => `
--- Question ${idx + 1} ---
Question: ${q.question}
Options: ${q.options.join(', ')}
Explanation: ${q.explanation || 'N/A'}
`).join('\n')}

Respond ONLY with a valid JSON array of objects in the same order as the questions. Do NOT wrap it in markdown code blocks. The response must be exactly a JSON array like this:
[
  { "equation": "...", "trick": "..." },
  { "equation": "...", "trick": "..." }
]
`;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: '/v1beta/models/gemma-4-31b-it:generateContent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': API_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const textContent = parsed.candidates[0].content.parts[0].text;
            let cleanText = textContent.trim();
            if (cleanText.startsWith('\`\`\`json')) {
              cleanText = cleanText.substring(7, cleanText.length - 3);
            }
            const result = JSON.parse(cleanText);
            resolve(result);
          } catch (err) {
            reject(new Error("Failed to parse response: " + data));
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log(`Loading data from ${DATA_FILE}`);
  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  const questions = JSON.parse(rawData);
  
  let processedCount = 0;
  let updatedCount = 0;

  let batchIndices = [];
  let batchQuestions = [];

  for (let i = 0; i < questions.length; i++) {
    if (!questions[i].equation || !questions[i].trick) {
      batchIndices.push(i);
      batchQuestions.push(questions[i]);

      if (batchQuestions.length === BATCH_SIZE) {
        console.log(`Processing batch of ${BATCH_SIZE} questions (ending at index ${i})...`);
        try {
          const enrichments = await generateEnrichmentBatch(batchQuestions);
          
          if (!Array.isArray(enrichments) || enrichments.length !== batchQuestions.length) {
            throw new Error(`Expected array of length ${batchQuestions.length}, got ${enrichments?.length}`);
          }

          for (let j = 0; j < enrichments.length; j++) {
            questions[batchIndices[j]].equation = enrichments[j].equation;
            questions[batchIndices[j]].trick = enrichments[j].trick;
            updatedCount++;
          }
          console.log(`  -> Successfully enriched ${enrichments.length} questions.`);
        } catch (err) {
          console.error(`  -> Batch Failed: ${err.message}`);
        }

        processedCount += BATCH_SIZE;
        batchIndices = [];
        batchQuestions = [];
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2));
        console.log(`Intermediate save: ${updatedCount} total questions updated so far.`);
        
        await sleep(DELAY_MS);
      }
    }
  }

  // Process remaining questions if they form a partial batch
  if (batchQuestions.length > 0) {
    console.log(`Processing final batch of ${batchQuestions.length} questions...`);
    try {
      const enrichments = await generateEnrichmentBatch(batchQuestions);
      if (Array.isArray(enrichments) && enrichments.length === batchQuestions.length) {
        for (let j = 0; j < enrichments.length; j++) {
          questions[batchIndices[j]].equation = enrichments[j].equation;
          questions[batchIndices[j]].trick = enrichments[j].trick;
          updatedCount++;
        }
        console.log(`  -> Successfully enriched ${enrichments.length} questions.`);
      } else {
        throw new Error(`Expected array of length ${batchQuestions.length}, got ${enrichments?.length}`);
      }
    } catch (err) {
      console.error(`  -> Final Batch Failed: ${err.message}`);
    }
  }

  if (updatedCount > 0) {
    console.log(`Saving ${updatedCount} updated questions to file...`);
    fs.writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2));
    console.log('Done!');
  } else {
    console.log('No questions updated.');
  }
}

main().catch(console.error);
