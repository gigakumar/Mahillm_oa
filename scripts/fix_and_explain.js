import fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BATCH_SIZE = 150;
const DELAY_MS = 3000;

const FLAGS_FILE = 'public/data/review_flags.json';
const CURRENT_FILE = 'public/data/mechEngQuestions.json';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── GEMINI API ────────────────────────────────────────────────────
async function callGemini(prompt, batchJson, model = 'gemini-3.1-flash-lite') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const payload = {
    contents: [{ parts: [{ text: prompt + '\n\nJSON:\n' + batchJson }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`  [Gemini ${res.status}]:`, err.slice(0, 200));
      return null;
    }
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text).questions;
  } catch (e) {
    console.error('  [Gemini Error]:', e.message.slice(0, 200));
    return null;
  }
}

async function callWithRetry(prompt, batchJson, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const r = await callGemini(prompt, batchJson);
    if (r) return r;
    console.log(`  Retry ${i + 1}/${retries}...`);
    await sleep(15000);
  }
  return null;
}

// ─── MAIN ──────────────────────────────────────────────────────────
async function run() {
  console.log('Loading files...');
  const flags = JSON.parse(fs.readFileSync(FLAGS_FILE, 'utf-8'));
  let questions = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
  console.log(`Loaded ${questions.length} questions`);

  // ── STEP 1: Remove figure-dependent questions ──────────────────
  console.log('\n=== STEP 1: Remove figure-dependent questions ===');
  const figureTextKeys = new Set(
    flags.missing_referenced_figure.map(f => (f.question || '').trim().toLowerCase().slice(0, 80))
  );
  const beforeFigure = questions.length;
  questions = questions.filter(q => {
    const key = (q.question || '').trim().toLowerCase().slice(0, 80);
    return !figureTextKeys.has(key);
  });
  console.log(`Removed ${beforeFigure - questions.length} figure-dependent questions. Remaining: ${questions.length}`);

  // ── STEP 2: Fix off-domain topic tags ─────────────────────────
  console.log('\n=== STEP 2: Fix off-domain topic tags ===');
  const offDomainTextKeys = new Set(
    flags.possible_offdomain_content.map(f => (f.question || '').trim().toLowerCase().slice(0, 80))
  );
  const offDomainQuestions = questions.filter(q => {
    const key = (q.question || '').trim().toLowerCase().slice(0, 80);
    return offDomainTextKeys.has(key);
  });
  console.log(`Found ${offDomainQuestions.length} off-domain questions to re-tag`);

  if (offDomainQuestions.length > 0 && GEMINI_API_KEY) {
    // Re-tag in one batch (they're only 43)
    const retagPrompt = `You are an expert engineering educator. Re-assign the correct "subject" and "topic" for each question. These questions were previously mis-tagged.
Valid subjects include: "Industrial Engineering", "Production Management", "Operations Research", "Thermodynamics", "Fluid Mechanics", "Heat Transfer", "Strength of Materials", "Manufacturing Engineering", "Machine Design", "Theory of Machines", "Engineering Mechanics", "IC Engines", "Power Plant Engineering", "Materials Science", "Quantitative Aptitude", "Logical Reasoning".
Return ONLY JSON: { "questions": [ { "id": <id>, "subject": "...", "topic": "..." } ] }`;

    const result = await callWithRetry(retagPrompt, JSON.stringify(
      offDomainQuestions.map(q => ({ id: q.id, question: q.question, options: q.options })), null, 2
    ));

    if (result) {
      const map = new Map(result.map(r => [r.id, r]));
      let fixed = 0;
      for (const q of questions) {
        if (map.has(q.id)) {
          const tag = map.get(q.id);
          q.subject = tag.subject;
          q.topic = tag.topic;
          fixed++;
        }
      }
      console.log(`Re-tagged ${fixed} off-domain questions`);
    } else {
      console.warn('Re-tagging failed, skipping');
    }
  }

  // Save after steps 1 & 2
  fs.writeFileSync(CURRENT_FILE, JSON.stringify(questions, null, 2));
  console.log('Saved after steps 1 & 2');

  // ── STEP 3: Write explanations for missing ones ────────────────
  console.log('\n=== STEP 3: Write explanations for questions missing them ===');
  if (!GEMINI_API_KEY) { console.error('No GEMINI_API_KEY — skipping explanations'); return; }

  const needsExplanation = questions.filter(q =>
    !q.explanation || q.explanation.trim() === '' || q.explanation.includes('Coming soon')
  );
  console.log(`Questions needing explanations: ${needsExplanation.length}`);

  const explanationPrompt = `You are an expert engineering educator. For each question in the JSON array, write a clear, concise step-by-step explanation for why the correct answer (given by the "correct" index, 0-based) is right. Keep explanations under 120 words each.
Return ONLY JSON: { "questions": [ { "id": <id>, "explanation": "..." } ] }`;

  let explained = 0;
  const totalBatches = Math.ceil(needsExplanation.length / BATCH_SIZE);

  for (let i = 0; i < needsExplanation.length; i += BATCH_SIZE) {
    const batch = needsExplanation.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\nExplanation batch ${batchNum}/${totalBatches} (${batch.length} questions)...`);

    const batchJson = JSON.stringify(
      batch.map(q => ({ id: q.id, question: q.question, options: q.options, correct: q.correct })), null, 2
    );

    const result = await callWithRetry(explanationPrompt, batchJson);

    if (result && Array.isArray(result)) {
      const map = new Map(result.map(r => [r.id, r]));
      for (const q of questions) {
        if (map.has(q.id) && map.get(q.id).explanation) {
          q.explanation = map.get(q.id).explanation;
          explained++;
        }
      }
      fs.writeFileSync(CURRENT_FILE, JSON.stringify(questions, null, 2));
      console.log(`  ✅ Saved. ${explained} explanations written so far.`);
    } else {
      console.warn(`  ⚠️  Batch ${batchNum} failed. Skipping.`);
    }
    await sleep(DELAY_MS);
  }

  // ── FINAL: Re-assign clean IDs ─────────────────────────────────
  questions.forEach((q, idx) => { q.id = idx + 1; });
  fs.writeFileSync(CURRENT_FILE, JSON.stringify(questions, null, 2));

  console.log('\n✅ ALL DONE!');
  console.log(`Final question count: ${questions.length}`);
  console.log(`Explanations written this run: ${explained}`);

  const noExpl = questions.filter(q => !q.explanation || q.explanation.trim() === '').length;
  console.log(`Still missing explanations: ${noExpl}`);
}

run().catch(console.error);
