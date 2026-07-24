import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read API key from .env.local (ignored by .gitignore, safe from git push)
const envPath = path.join(__dirname, '../.env.local');
let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
  const dotenvContent = fs.readFileSync(envPath, 'utf-8');
  dotenvContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && k.trim() === 'VITE_GEMINI_API_KEY') {
      apiKey = v.trim();
    }
  });
}

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in environment or .env.local');
  process.exit(1);
}

const MODEL = 'gemini-3.5-flash-lite';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

const questionsPath = path.join(__dirname, '../public/data/mechEngQuestions.json');
const allQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

// Pick target question ID or defaults
const targetIdArg = process.argv[2] ? parseInt(process.argv[2], 10) : null;
let selectedQuestions = [];

if (targetIdArg) {
  const q = allQuestions.find(q => q.id === targetIdArg);
  if (q) selectedQuestions.push(q);
}

if (selectedQuestions.length === 0) {
  // Pick representative questions from Strength of Materials & Heat Transfer
  const qSOM = allQuestions.find(q => q.subject === 'Strength of Materials' && q.question.length > 40) || allQuestions[10];
  const qHT = allQuestions.find(q => q.subject === 'Heat Transfer' && q.question.length > 40) || allQuestions[15];
  selectedQuestions = [qSOM, qHT];
}

console.log(`\n🚀 Model: ${MODEL}`);
console.log(`🔑 Using Gemini API Key securely from .env.local (.gitignore protected)`);
console.log(`🚀 Refining ${selectedQuestions.length} Mechanical Engineering Question(s)...`);

const REFINEMENT_PROMPT = `You are a distinguished Professor of Mechanical Engineering and an expert GATE / ESE exam setter.

Your task is to take a raw Mechanical Engineering question and refine it into an exceptionally clear, mathematically rigorous, high-yield competitive exam question.

For each question provided:
1. Verify the correct option mathematically. (Correct any errors if the raw key was wrong!).
2. Refine the question text: use LaTeX for math symbols, clear physical units, and precise wording.
3. Refine the options: format cleanly with clear units and mathematical notation.
4. Provide a Step-by-Step Solution: write out the derivation from fundamental principles step by step.
5. Provide a Distractor Analysis: explain why each incorrect option is wrong and what specific student misconception leads to picking it.
6. List the Core Governing Formula(s).
7. Provide a Pro Exam Tip / Speed Shortcut for solving it under exam pressure.

Return ONLY a valid JSON object matching this structure:
{
  "id": <number>,
  "subject": "<Subject Name>",
  "topic": "<Topic Name>",
  "raw_question": "<Original Question Text>",
  "refined_question": "<Refined Question Text with LaTeX>",
  "options": [
    "A) <Option A>",
    "B) <Option B>",
    "C) <Option C>",
    "D) <Option D>"
  ],
  "verified_correct_index": <0-indexed integer of the correct option>,
  "verified_correct_option": "<Letter and Text of Correct Option>",
  "raw_key_was_correct": <boolean>,
  "step_by_step_solution": "<Comprehensive step by step explanation with LaTeX>",
  "distractor_analysis": {
    "option_A": "<Analysis for Option A>",
    "option_B": "<Analysis for Option B>",
    "option_C": "<Analysis for Option C>",
    "option_D": "<Analysis for Option D>"
  },
  "governing_formulas": [
    "<Formula 1>",
    "<Formula 2>"
  ],
  "pro_exam_tip": "<Concise GATE/ESE speed trick or pitfall warning>"
}`;

async function refineQuestion(q) {
  console.log(`\n------------------------------------------------------------`);
  console.log(`📥 RAW QUESTION (ID: ${q.id} | Subject: ${q.subject})`);
  console.log(`Question: ${q.question}`);
  console.log(`Options: ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ')}`);
  console.log(`------------------------------------------------------------`);

  const payloadText = `RAW QUESTION DETAILS:
ID: ${q.id}
Subject: ${q.subject}
Topic: ${q.topic}
Question Statement: ${q.question}
Options:
${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n')}
Raw Marked Correct Option: Option ${String.fromCharCode(65 + q.correct)}) ${q.options[q.correct]}
Raw Explanation: ${q.explanation || 'N/A'}`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: REFINEMENT_PROMPT + '\n\n' + payloadText }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ API Error HTTP ${res.status}:`, errText);
      return null;
    }

    const data = await res.json();
    const rawJsonText = data.candidates[0].content.parts[0].text;
    return JSON.parse(rawJsonText);
  } catch (e) {
    console.error(`❌ Failed to refine question ID ${q.id}:`, e.message);
    return null;
  }
}

async function main() {
  const results = [];
  for (const q of selectedQuestions) {
    const refined = await refineQuestion(q);
    if (refined) {
      results.push(refined);
      console.log(`\n✨ GEMINI (${MODEL}) REFINED OUTPUT FOR QUESTION ID ${q.id}:`);
      console.log(JSON.stringify(refined, null, 2));
    }
  }

  const outputPath = path.join(__dirname, '../public/data/gemini_refined_questions.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Saved refined output to ${outputPath}`);
}

main();
