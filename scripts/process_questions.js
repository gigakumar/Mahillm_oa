import fs from 'fs';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

if (process.env.https_proxy) {
  setGlobalDispatcher(new ProxyAgent(process.env.https_proxy));
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const FILE_PATH = process.argv[2];
const ACTION = process.argv[3]; // 'improve', 'tag', or 'all'
const LIMIT = parseInt(process.argv[4] || '50', 10);

if (!FILE_PATH || !fs.existsSync(FILE_PATH)) {
  console.error("ERROR: Valid JSON file path required as first argument.");
  process.exit(1);
}
if (ACTION !== 'improve' && ACTION !== 'tag' && ACTION !== 'all' && ACTION !== 'fix-options') {
  console.error("ERROR: Action must be 'improve', 'tag', 'all', or 'fix-options'.");
  process.exit(1);
}

const BATCH_SIZE = 200;
const DELAY_MS = 2000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGroqAPI(prompt, batch, model) {
  if (!GROQ_API_KEY) return null;
  const url = `https://api.groq.com/openai/v1/chat/completions`;
  const payload = {
    model: model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: prompt + "\n\nYou must return a JSON object containing a single array called 'questions'. For example: { \"questions\": [ { ... }, { ... } ] }"
      },
      {
        role: "user",
        content: JSON.stringify(batch, null, 2)
      }
    ],
    temperature: 0.2
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Groq HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content).questions;
  } catch (error) {
    console.error(`[Groq ${model} Failed]: ${error.message}`);
    return null;
  }
}

async function callGeminiAPI(prompt, batch, model) {
  if (!GEMINI_API_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const payload = {
    contents: [{
      parts: [{ text: prompt + "\n\nYou must return a JSON object containing a single array called 'questions'.\n\nJSON Batch to process:\n" + JSON.stringify(batch, null, 2) }]
    }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text).questions;
  } catch (error) {
    console.error(`[Gemini ${model} Failed]: ${error.message}`);
    return null;
  }
}

async function callOpenAIAPI(prompt, batch, model) {
  if (!OPENAI_API_KEY) return null;
  const url = `https://api.openai.com/v1/chat/completions`;
  const payload = {
    model: model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt + "\n\nYou must return a JSON object containing a single array called 'questions'. For example: { \"questions\": [ { ... }, { ... } ] }" },
      { role: "user", content: JSON.stringify(batch, null, 2) }
    ],
    temperature: 0.2
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content).questions;
  } catch (error) {
    console.error(`[OpenAI ${model} Failed]: ${error.message}`);
    return null;
  }
}

async function callAnyAPI(prompt, batch) {
  const GEMINI_MODELS = [
    'gemini-3.1-flash-lite'
  ];

  for (const model of GEMINI_MODELS) {
    let res = await callGeminiAPI(prompt, batch, model);
    if (res) return { provider: `Gemini (${model})`, data: res };
  }
  
  return null;
}

async function run() {
  const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
  let questions = JSON.parse(fileData);
  let targetQuestions = [];
  
  if (ACTION === 'improve') {
    targetQuestions = questions.filter(q => !q.explanation || q.explanation.includes('Coming soon') || q.explanation.trim() === '');
  } else if (ACTION === 'tag') {
    targetQuestions = questions.filter(q => q.topic === 'General' || !q.topic || !q.difficulty || q.category === 'General');
  } else if (ACTION === 'fix-options') {
    targetQuestions = questions;
  } else if (ACTION === 'all') {
    targetQuestions = questions.filter(q => !q.explanation || q.explanation.includes('Coming soon') || q.explanation.trim() === '' || q.topic === 'General' || !q.topic || !q.difficulty || q.category === 'General');
  }
  
  if (targetQuestions.length === 0) targetQuestions = questions;
  targetQuestions = targetQuestions.slice(0, LIMIT);
  
  let processedCount = 0;
  console.log(`Starting '${ACTION}' processing for ${targetQuestions.length} questions from ${FILE_PATH}...`);

  for (let i = 0; i < targetQuestions.length; ) {
    const batch = targetQuestions.slice(i, i + BATCH_SIZE);
    let prompt = "";
    if (ACTION === 'improve') {
      prompt = `You are an expert engineering test content reviewer. Fix incoherence and write step-by-step explanations for the correct option (index in 'correct' field). Do NOT change meaning.`;
    } else if (ACTION === 'tag') {
      prompt = `You are an expert taxonomy categorizer. Assign the most accurate 'topic', 'category', and 'difficulty'. Do not modify text.`;
    } else if (ACTION === 'fix-options') {
      prompt = `You are an expert engineering test content reviewer. Fix any incorrect, mangled, or strange characters (e.g., encoding issues, bad math symbols, OCR errors) in the 'question' string and the 'options' array. Ensure all text is clean and readable. Do NOT change the meaning or the 'correct' index.`;
    } else if (ACTION === 'all') {
      prompt = `You are an expert engineering test content reviewer. Fix incoherence, replace 'Coming soon' with a step-by-step explanation, and assign 'topic', 'category', and 'difficulty'. Do NOT change meaning.`;
    }

    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} / ${Math.ceil(targetQuestions.length/BATCH_SIZE)}...`);
    
    let result = await callAnyAPI(prompt, batch);
    
    if (result && Array.isArray(result.data)) {
      const processedBatch = result.data;
      for (const updatedQ of processedBatch) {
        const index = questions.findIndex(q => q.id === updatedQ.id);
        if (index !== -1) {
          questions[index] = { ...questions[index], ...updatedQ };
          processedCount++;
        }
      }
      fs.writeFileSync(FILE_PATH, JSON.stringify(questions, null, 2));
      console.log(`[Success via ${result.provider}] Saved progress. Processed ${processedCount} questions total.`);
      i += BATCH_SIZE; 
      await sleep(DELAY_MS);
    } else {
      console.error(`All APIs failed for this batch. Retrying in 10s...`);
      await sleep(10000); 
    }
  }

  console.log(`\nFinished processing! Successfully updated ${processedCount} questions.`);
}

run().catch(console.error);
