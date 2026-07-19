import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = '........';
const DATA_FILE = path.join(__dirname, '../public/data/mechEngQuestions.json');

// Number of questions to process per run (for testing/batching)
const BATCH_SIZE = 5; 
const DELAY_MS = 2000; // Delay between requests to avoid rate limits

async function generateEnrichment(question) {
  const prompt = `
You are an expert engineering tutor. For the following multiple-choice question, please provide:
1. "equation": The exact mathematical equation resolving the question (e.g., '100 J = 20 J + 80 J' or a key substitution). Keep it concise, representing the core calculation. If there's no calculation, provide the core theoretical principle as a concise mathematical or logical statement.
2. "trick": A unique, question-specific exam trick to avoid common pitfalls for this exact question. Do not give generic advice.

Question: ${question.question}
Options: ${question.options.join(', ')}
Explanation: ${question.explanation || 'N/A'}

Respond ONLY with a valid JSON object in this format:
{
  "equation": "...",
  "trick": "..."
}
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
      path: '/v1beta/models/gemini-flash-latest:generateContent',
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
            const result = JSON.parse(textContent);
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

  for (let i = 0; i < questions.length; i++) {
    // Process only questions that don't have equation/trick yet
    if (!questions[i].equation || !questions[i].trick) {
      if (processedCount >= BATCH_SIZE) break;

      console.log(`Processing question ${i + 1}/${questions.length}: ${questions[i].question.substring(0, 50)}...`);
      
      try {
        const enrichment = await generateEnrichment(questions[i]);
        questions[i].equation = enrichment.equation;
        questions[i].trick = enrichment.trick;
        console.log(`  -> Success: ${enrichment.equation}`);
        updatedCount++;
      } catch (err) {
        console.error(`  -> Failed: ${err.message}`);
      }

      processedCount++;
      if (processedCount < BATCH_SIZE) {
        await sleep(DELAY_MS);
      }
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
