/**
 * gemini_batch_enrich.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads a question bank JSON, sends questions in batches to Gemini API,
 * fetches per-question AI analysis (ai_correct, ai_wrong, formula, trick),
 * and writes the enriched data back to the same JSON file.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/gemini_batch_enrich.js [options]
 *
 * Options:
 *   --file    <path>   Path to JSON file  (default: public/data/mechEngQuestions.json)
 *   --model   <id>     Gemini model ID    (default: gemini-3.5-flash)
 *   --batch   <n>      Questions per API call (default: 10)
 *   --concur  <n>      Concurrent API calls   (default: 3)
 *   --delay   <ms>     Delay between groups   (default: 1500)
 *   --limit   <n>      Max questions to process in this run (default: all)
 *   --force            Re-enrich already-enriched questions
 *
 * Available models:
 *   gemini-3.5-flash          ← fastest, recommended default
 *   gemini-2.5-flash          ← legacy, being deprecated
 *   gemini-3-flash            ← balanced
 *   gemini-3.1-flash-lite     ← cost-efficient
 *   gemma-4-31b-it            ← open-weight, most capable
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Parse CLI args ────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    file: path.join(__dirname, '../public/data/mechEngQuestions.json'),
    model: 'gemini-3.5-flash-lite',
    batch: 15,
    concur: 1,
    delay: 1000,
    limit: Infinity,
    force: false,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file')   opts.file   = path.resolve(args[++i]);
    if (args[i] === '--model')  opts.model  = args[++i];
    if (args[i] === '--batch')  opts.batch  = parseInt(args[++i]);
    if (args[i] === '--concur') opts.concur = parseInt(args[++i]);
    if (args[i] === '--delay')  opts.delay  = parseInt(args[++i]);
    if (args[i] === '--limit')  opts.limit  = parseInt(args[++i]);
    if (args[i] === '--force')  opts.force  = true;
  }
  return opts;
}

const opts = parseArgs();

// ── Validate API key ──────────────────────────────────────────────────────────
let API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const dotenvContent = fs.readFileSync(envPath, 'utf-8');
    dotenvContent.split('\n').forEach(line => {
      const [k, v] = line.split('=');
      if (k && k.trim() === 'VITE_GEMINI_API_KEY') {
        API_KEY = v.trim();
      }
    });
  }
}

if (!API_KEY) {
  console.error('\n❌  GEMINI_API_KEY env var not set and not found in .env.local.');
  process.exit(1);
}

// ── Model display map ─────────────────────────────────────────────────────────
const MODEL_LABELS = {
  'gemini-3.5-flash-lite': 'Gemini 3.5 Flash Lite',
  'gemini-flash-latest':   'Gemini Flash (Latest)',
  'gemini-3.5-flash':      'Gemini 3.5 Flash',
  'gemini-2.5-flash':      'Gemini 2.5 Flash',
  'gemini-3-flash':        'Gemini 3 Flash',
  'gemini-3.1-flash-lite': 'Gemini 3.1 Flash Lite',
  'gemma-4-31b-it':        'Gemma 4 31B',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Strip HTML tags from question/option text ─────────────────────────────────
function stripHtml(str) {
  return (str || '').replace(/<[^>]*>/g, '').trim();
}

// ── Build the Gemini prompt for a batch of questions ──────────────────────────
function buildPrompt(batch) {
  const lines = batch.map((q, i) => {
    const opts = q.options.map((o, oi) => `  ${String.fromCharCode(65 + oi)}) ${stripHtml(o)}`).join('\n');
    const correctLetter = String.fromCharCode(65 + q.correct);
    return `--- Question ${i + 1} (ID: ${q.id}) ---
Question: ${stripHtml(q.question)}
Options:
${opts}
Correct Answer: Option ${correctLetter}) ${stripHtml(q.options[q.correct])}`;
  }).join('\n\n');

  return `You are an expert tutor for competitive engineering exams (GATE, PSU, UPSC-ESE, etc.).

I will give you ${batch.length} MCQ questions. For EACH question, return a JSON object with EXACTLY these 4 fields:

- "ai_correct": 2-3 sentence explanation of WHY the correct option is right, referencing the specific calculation or concept inline. Be specific to this question.
- "ai_wrong": 2-3 sentence explanation of the most common mistake — what wrong reasoning leads a student to pick the WRONG option. Be specific (mention the wrong option letter and value if relevant).
- "formula": The primary formula/equation for this question (compact, e.g. "Δx = y − x, δ(Δx) = √(δx² + δy²)"). If no formula applies, state the key principle in equation form.
- "trick": One concise exam tip specific to THIS question to avoid the most common trap.

Return ONLY a valid JSON array of ${batch.length} objects in the same order as the questions. No markdown fences, no extra text.

Example shape:
[
  {
    "ai_correct": "...",
    "ai_wrong": "...",
    "formula": "...",
    "trick": "..."
  }
]

Here are the questions:

${lines}`;
}

// ── Raw Gemini HTTP call ──────────────────────────────────────────────────────
function callGeminiOnce(prompt, model) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${model}:generateContent`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        if (res.statusCode === 429) { reject(new Error('RATE_LIMIT_429')); return; }
        if (res.statusCode === 503) { reject(new Error('UNAVAILABLE_503')); return; }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 300)}`)); return;
        }
        try {
          const json = JSON.parse(raw);
          // Join ALL parts (Gemini sometimes splits long responses across multiple parts)
          const parts = json?.candidates?.[0]?.content?.parts || [];
          let text = parts.map(p => p.text || '').join('');
          text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
          resolve(parsePartialJsonArray(text));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message} | raw: ${raw.slice(0, 400)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Resilient Partial JSON Array Parser ───────────────────────────────────────
function parsePartialJsonArray(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1) {
      const repaired = text.slice(0, lastBrace + 1) + ']';
      try {
        return JSON.parse(repaired);
      } catch (e2) {
        const matches = text.match(/\{[\s\S]*?\}/g) || [];
        const items = [];
        for (const m of matches) {
          try { items.push(JSON.parse(m)); } catch (e3) {}
        }
        return items;
      }
    }
    return [];
  }
}

// ── Gemini call with exponential backoff retry ────────────────────────────────
async function callGemini(prompt, model, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callGeminiOnce(prompt, model);
    } catch (err) {
      const retryable = err.message.includes('UNAVAILABLE_503') || err.message.includes('RATE_LIMIT_429');
      if (retryable && attempt < maxRetries) {
        const wait = attempt * 4000; // 4s, 8s, 12s, 16s
        const reason = err.message.includes('503') ? 'Server busy (503)' : 'Rate limit (429)';
        process.stdout.write(`\n  ⏳ ${reason} — retrying in ${wait/1000}s (attempt ${attempt}/${maxRetries})...\r`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

// ── Process one batch ─────────────────────────────────────────────────────────
async function processBatch(batch, batchIndex, model) {
  const prompt = buildPrompt(batch.questions);
  const enrichments = await callGemini(prompt, model);

  if (!Array.isArray(enrichments) || enrichments.length === 0) {
    throw new Error(`Expected non-empty array from Gemini, got ${typeof enrichments}`);
  }

  const count = Math.min(enrichments.length, batch.questions.length);
  for (let j = 0; j < count; j++) {
    const e = enrichments[j];
    if (!e) continue;
    const qi = batch.indices[j];
    batch.allQuestions[qi].ai_correct = e.ai_correct || '';
    batch.allQuestions[qi].ai_wrong   = e.ai_wrong   || '';
    batch.allQuestions[qi].formula    = e.formula     || '';
    batch.allQuestions[qi].trick      = e.trick       || '';
  }

  return count;
}

// ── Pretty progress bar ───────────────────────────────────────────────────────
function progressBar(done, total, width = 30) {
  const pct = Math.floor((done / total) * 100);
  const filled = Math.round((done / total) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `[${bar}] ${pct}% (${done}/${total})`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║       MahiLLM — Gemini Batch Question Enricher      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log(`📄  File:    ${opts.file}`);
  console.log(`🤖  Model:   ${MODEL_LABELS[opts.model] || opts.model}`);
  console.log(`📦  Batch:   ${opts.batch} questions/call`);
  console.log(`⚡  Concur:  ${opts.concur} parallel calls`);
  console.log(`⏱️   Delay:   ${opts.delay}ms between groups`);
  console.log(`🔁  Force:   ${opts.force ? 'yes (re-enrich all)' : 'no (skip already enriched)'}\n`);

  if (!fs.existsSync(opts.file)) {
    console.error(`❌  File not found: ${opts.file}`);
    process.exit(1);
  }

  console.log('📖  Loading JSON...');
  const allQuestions = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
  console.log(`    Loaded ${allQuestions.length.toLocaleString()} questions.\n`);

  // ── Find questions needing enrichment ────────────────────────────────────
  const needsEnrichment = [];
  for (let i = 0; i < allQuestions.length; i++) {
    const q = allQuestions[i];
    const alreadyDone = q.ai_correct && q.ai_wrong && q.formula && q.trick;
    if (!alreadyDone || opts.force) {
      needsEnrichment.push(i);
    }
    if (needsEnrichment.length >= opts.limit) break;
  }

  if (needsEnrichment.length === 0) {
    console.log('✅  All questions are already enriched. Use --force to re-process.');
    process.exit(0);
  }

  console.log(`🎯  Questions to enrich: ${needsEnrichment.length.toLocaleString()} of ${allQuestions.length.toLocaleString()}`);
  const estimatedCalls = Math.ceil(needsEnrichment.length / opts.batch);
  const estimatedGroups = Math.ceil(estimatedCalls / opts.concur);
  const estimatedSec = Math.round(estimatedGroups * (opts.delay / 1000 + 3));
  console.log(`📊  API calls needed:   ~${estimatedCalls} (in ${estimatedGroups} groups of ${opts.concur})`);
  console.log(`⏳  Estimated time:     ~${estimatedSec}s\n`);

  // ── Build batches ────────────────────────────────────────────────────────
  const batches = [];
  for (let i = 0; i < needsEnrichment.length; i += opts.batch) {
    const chunk = needsEnrichment.slice(i, i + opts.batch);
    batches.push({
      indices: chunk,
      questions: chunk.map((qi) => allQuestions[qi]),
      allQuestions,  // reference so processBatch can write back
    });
  }

  let totalEnriched = 0;
  let totalFailed = 0;
  let abortDueToRateLimit = false;

  // ── Run in groups of `concur` ────────────────────────────────────────────
  for (let gi = 0; gi < batches.length && !abortDueToRateLimit; gi += opts.concur) {
    const group = batches.slice(gi, gi + opts.concur);
    const groupNum = Math.floor(gi / opts.concur) + 1;
    const totalGroups = Math.ceil(batches.length / opts.concur);

    process.stdout.write(
      `\r🔄  Group ${String(groupNum).padStart(4)} / ${totalGroups}  ${progressBar(totalEnriched, needsEnrichment.length)}   `
    );

    const results = await Promise.allSettled(
      group.map((batch, idx) => processBatch(batch, gi + idx, opts.model))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        totalEnriched += result.value;
      } else {
        const msg = result.reason?.message || String(result.reason);
        if (msg.includes('RATE_LIMIT_429')) {
          console.error(`\n\n⛔  Rate limit hit (429). Saving progress and stopping.`);
          abortDueToRateLimit = true;
          break;
        }
        console.error(`\n  ⚠️  Batch error: ${msg.slice(0, 200)}`);
        totalFailed++;
      }
    }

    // Save after every group (so progress is never lost)
    fs.writeFileSync(opts.file, JSON.stringify(allQuestions, null, 2));

    if (!abortDueToRateLimit && gi + opts.concur < batches.length) {
      await sleep(opts.delay);
    }
  }

  process.stdout.write('\n');

  // ── Final summary ────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║               Enrichment Complete            ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  ✅  Enriched : ${String(totalEnriched).padEnd(28)} ║`);
  console.log(`║  ❌  Failed   : ${String(totalFailed).padEnd(28)} ║`);
  console.log(`║  💾  Saved to : ${path.basename(opts.file).padEnd(28)} ║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  if (abortDueToRateLimit) {
    console.log('💡  Re-run the script to continue from where it stopped (already-enriched questions will be skipped).\n');
  }
}

main().catch((err) => {
  console.error('\n💥  Fatal error:', err);
  process.exit(1);
});
