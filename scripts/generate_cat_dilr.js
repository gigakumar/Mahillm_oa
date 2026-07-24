import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, '../public/data/cat_dilr_questions.json');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3.5-flash-lite';

const PROMPTS = [
  {
    topic: "Logical Reasoning - Matrix Arrangement",
    instruction: "Generate a highly complex CAT-level Logical Reasoning set involving a matrix arrangement (e.g. 5 people, 5 cities, 5 professions, 5 colors). The passage should provide partial constraints (some positive, some negative). Following the passage, generate 4 questions that test deductions from the passage. Ensure the questions have 4 options and one unambiguous correct answer. Return ONLY a JSON array."
  },
  {
    topic: "Data Interpretation - Missing Data Table",
    instruction: "Generate a CAT-level Data Interpretation set. Describe a scenario with a table that has missing values (e.g. sales data across 4 quarters for 4 companies, but some values are missing). Provide rules that allow the missing data to be deduced. Then generate 4 questions based on the complete data. Return ONLY a JSON array."
  },
  {
    topic: "Logical Reasoning - Games and Tournaments",
    instruction: "Generate a CAT-level Logical Reasoning set about a sports tournament (e.g. a round-robin tournament with 5 teams, goals scored, points table). Provide partial information and complex constraints. Generate 4 questions. Return ONLY a JSON array."
  },
  {
    topic: "Data Interpretation - Multiple Charts",
    instruction: "Generate a CAT-level Data Interpretation set that describes data from two different charts (e.g., a pie chart showing market share and a bar chart showing total revenue). The text should describe the data points so a student can visualize it. Generate 4 challenging questions requiring calculations across both charts. Return ONLY a JSON array."
  },
  {
    topic: "Logical Reasoning - Venn Diagrams (4 Sets)",
    instruction: "Generate a CAT-level Logical Reasoning set based on a 4-set Venn Diagram scenario (e.g., students enrolled in 4 different clubs). Provide complex overlapping constraints. Generate 4 questions. Return ONLY a JSON array."
  }
];

const SYSTEM_INSTRUCTION = `You are an expert CAT (Common Admission Test) question setter. You generate extremely challenging, logically rigorous DILR sets.
You MUST respond with ONLY a valid JSON array of question objects. NO markdown formatting, NO backticks.
Schema:
[
  {
    "section": "DILR",
    "topic": "<Specific Topic>",
    "passage": "<The main problem description, data, and constraints. Use \\n for newlines>",
    "question": "<The specific question>",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "<The exact string of the correct option>",
    "explanation": "<Step-by-step logical deduction to solve it>",
    "difficulty": "Hard"
  }
]
Note: For a single passage, generate 4 objects in the array, each having the EXACT SAME 'passage' text but different 'question'.`;

async function callGemini(promptObj) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ parts: [{ text: promptObj.instruction }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  };

  console.log(`Generating set: ${promptObj.topic}...`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No text returned from Gemini');
  }

  try {
    const parsed = JSON.parse(text.trim());
    return parsed;
  } catch (e) {
    console.error('Failed to parse JSON:', text);
    throw e;
  }
}

async function main() {
  const allQuestions = [];
  
  for (const prompt of PROMPTS) {
    try {
      const questions = await callGemini(prompt);
      allQuestions.push(...questions);
      // Small delay
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`Failed on ${prompt.topic}:`, err.message);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2));
  console.log(`\\n✅ Successfully generated ${allQuestions.length} DILR questions and saved to ${OUTPUT_FILE}`);
}

main();
