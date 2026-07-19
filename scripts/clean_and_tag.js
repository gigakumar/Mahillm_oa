import fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BATCH_SIZE = 150;
const DELAY_MS = 3000;

const INPUT_FILE = 'public/cleaned_mechEngQuestions.json';
const OUTPUT_FILE = 'public/data/mechEngQuestions.json';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── JUNK DETECTION ────────────────────────────────────────────────
function isJunk(q) {
  const text = (q.question || '').trim();
  const opts = q.options || [];

  // Too short
  if (text.length < 8) return true;
  // No options or only 1 option
  if (opts.length < 2) return true;
  // Looks like a page header / book line (no '?' or verb, all numbers/symbols)
  if (/^[\d\s\.\-\+\*\/\(\)x×÷=<>%]+$/.test(text)) return true;
  // Placeholder values only
  if (opts.every(o => /^[a-d]\)?\s*$/.test(o.trim()) || o.trim().length < 1)) return true;
  // Options are all identical
  if (new Set(opts.map(o => o.trim().toLowerCase())).size === 1) return true;
  // NAT garbage: options are just "(blank)" or "NAT" or numeric fragments only
  if (opts.every(o => /^[\d\.\-\+e\s]+$/.test(o.trim()))) return true;

  return false;
}

// ─── DEDUPLICATION ────────────────────────────────────────────────
function deduplicate(questions) {
  const seen = new Map();
  const kept = [];
  let removed = 0;
  for (const q of questions) {
    const key = (q.question || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 100);
    if (!seen.has(key)) {
      seen.set(key, true);
      kept.push(q);
    } else {
      removed++;
    }
  }
  console.log(`Deduplication: removed ${removed} duplicates, kept ${kept.length}`);
  return kept;
}

// ─── DIFFICULTY NORMALIZER ────────────────────────────────────────
function normalizeDifficulty(d) {
  if (!d) return null;
  const s = d.toString().trim().toUpperCase();
  if (s === 'EASY' || s === 'LOW') return 'LOW';
  if (s === 'MEDIUM' || s === 'MODERATE') return 'MEDIUM';
  if (s === 'HARD' || s === 'HIGH') return 'HIGH';
  return null;
}

// ─── GEMINI API ────────────────────────────────────────────────────
async function callGeminiForTagging(batch) {
  if (!GEMINI_API_KEY) { console.error('No GEMINI_API_KEY'); return null; }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`;
  const prompt = `You are an expert engineering educator. For each question in the JSON array below, assign:
1. "difficulty": one of exactly "LOW", "MEDIUM", or "HIGH" based on complexity.
   - LOW: basic recall, single-step, formula plug-in
   - MEDIUM: 2-3 step reasoning, concept application
   - HIGH: multi-concept, derivation, analysis required
2. "subject": a single short subject string (e.g. "Thermodynamics", "Fluid Mechanics", "Strength of Materials", "Manufacturing Engineering", "Heat Transfer", "Machine Design", "Theory of Machines", "Engineering Mechanics", "Industrial Engineering", "Power Plant Engineering", "IC Engines", "Materials Science", "Quantitative Aptitude", "Logical Reasoning", "Data Interpretation")

Return ONLY a JSON object: { "questions": [ { "id": <id>, "difficulty": "...", "subject": "..." }, ... ] }
Do NOT include any other fields. Do NOT change existing IDs.`;

  const payload = {
    contents: [{ parts: [{ text: prompt + '\n\nJSON:\n' + JSON.stringify(batch.map(q => ({ id: q.id, question: q.question, options: q.options })), null, 2) }] }],
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
      console.error(`[Gemini Failed ${res.status}]:`, err.slice(0, 300));
      return null;
    }
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text).questions;
  } catch (e) {
    console.error('[Gemini Error]:', e.message);
    return null;
  }
}

// ─── MAIN ──────────────────────────────────────────────────────────
async function run() {
  console.log('Loading cleaned questions...');
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Loaded ${raw.length} questions from ${INPUT_FILE}`);

  // Step 1: Remove junk
  const afterJunk = raw.filter(q => !isJunk(q));
  console.log(`After junk removal: ${afterJunk.length} (removed ${raw.length - afterJunk.length})`);

  // Step 2: Deduplicate
  const afterDedup = deduplicate(afterJunk);

  // Step 3: Normalize existing difficulty tags
  for (const q of afterDedup) {
    const norm = normalizeDifficulty(q.difficulty);
    if (norm) q.difficulty = norm;
    // Also normalize topic -> subject if subject missing
    if (!q.subject && q.topic) q.subject = q.topic;
  }

  // Step 4: Find questions needing tagging (missing difficulty or subject)
  const needsTagging = afterDedup.filter(q =>
    !normalizeDifficulty(q.difficulty) || !q.subject
  );
  console.log(`Questions needing AI tagging: ${needsTagging.length}`);

  // Step 5: Tag via Gemini in batches
  let tagged = 0;
  if (needsTagging.length > 0 && GEMINI_API_KEY) {
    for (let i = 0; i < needsTagging.length; i += BATCH_SIZE) {
      const batch = needsTagging.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(needsTagging.length / BATCH_SIZE);
      console.log(`Tagging batch ${batchNum}/${totalBatches}...`);

      let result = null;
      let retries = 0;
      while (!result && retries < 3) {
        result = await callGeminiForTagging(batch);
        if (!result) { retries++; await sleep(15000); }
      }

      if (result && Array.isArray(result)) {
        const map = new Map(result.map(r => [r.id, r]));
        for (const q of afterDedup) {
          if (map.has(q.id)) {
            const tag = map.get(q.id);
            if (!normalizeDifficulty(q.difficulty) && tag.difficulty) {
              q.difficulty = normalizeDifficulty(tag.difficulty) || tag.difficulty;
            }
            if (!q.subject && tag.subject) {
              q.subject = tag.subject;
            }
          }
        }
        tagged += result.length;
        // Save incremental progress
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(afterDedup, null, 2));
        console.log(`[Saved] Batch ${batchNum} done. ${tagged} tagged so far.`);
      } else {
        console.warn(`Batch ${batchNum} failed after retries. Skipping.`);
      }
      await sleep(DELAY_MS);
    }
  }

  // Step 6: Final save
  // Re-assign clean sequential IDs
  afterDedup.forEach((q, idx) => { q.id = idx + 1; });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(afterDedup, null, 2));

  console.log(`\n✅ DONE!`);
  console.log(`Final question count: ${afterDedup.length}`);
  console.log(`Tagged via AI: ${tagged}`);

  // Stats
  const diffStats = {};
  const subjectStats = {};
  for (const q of afterDedup) {
    diffStats[q.difficulty || 'Unknown'] = (diffStats[q.difficulty || 'Unknown'] || 0) + 1;
    subjectStats[q.subject || q.topic || 'Unknown'] = (subjectStats[q.subject || q.topic || 'Unknown'] || 0) + 1;
  }
  console.log('\nDifficulty distribution:', JSON.stringify(diffStats, null, 2));
  console.log('\nTop subjects:', JSON.stringify(Object.entries(subjectStats).sort((a,b)=>b[1]-a[1]).slice(0, 20), null, 2));
}

run().catch(console.error);
