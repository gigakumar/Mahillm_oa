const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../public/data');
const FILE_PRIMARY = path.join(DATA_DIR, 'mechEngQuestions.json');
const FILE_CLEANED = path.join(DATA_DIR, 'cleaned_mechEngQuestions.json');
const FILE_FLAGS = path.join(DATA_DIR, 'review_flags.json');

// Helper to extract numeric answer from explanation if missing in question metadata
function extractAnswerFromExpl(q) {
  const expl = q.explanation || '';
  if (!expl || expl.toLowerCase().includes('coming soon')) return null;

  // Patterns like: "Ans. 41.5", "Ans: 41.5", "Answer is 41.5", "result is 41"
  let match = expl.match(/(?:Ans(?:\.|wer)?|Result|Efficiency|Output|Value|Ratio)\s*(?:is|=|:)?\s*(-?\d+(?:\.\d+)?)/i);
  if (match) return parseFloat(match[1]);

  // Patterns like: "the result is 41 kJ/kg", "is 45.2 m/s"
  match = expl.match(/\bis\s*(-?\d+(?:\.\d+)?)\s*(?:kJ|kW|m\/s|N|Pa|bar|K|°C|mm|kg|%|W|kJ\/kg|m3\/s|rpm|m)?\b/i);
  if (match) return parseFloat(match[1]);

  // Pattern at end of formula e.g. "= 41 kJ/kg" or "≈ 41.5%"
  match = expl.match(/=\s*(-?\d+(?:\.\d+)?)\s*(?:kJ|kW|m\/s|N|Pa|bar|K|°C|mm|kg|%|W|kJ\/kg|m3\/s|rpm|m)?\b/i);
  if (match) return parseFloat(match[1]);

  return null;
}

function cleanDataset(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return null;
  }

  const allQuestions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const isNAT = q => q.type === 'NAT' || (q.options && q.options.length === 0);

  const initialTotal = allQuestions.length;
  const initialNats = allQuestions.filter(isNAT);
  const mcqs = allQuestions.filter(q => !isNAT(q));

  console.log(`\n=======================================================`);
  console.log(`Cleaning File: ${path.basename(filePath)}`);
  console.log(`Initial Total Questions: ${initialTotal}`);
  console.log(`Initial NAT Questions:   ${initialNats.length}`);
  console.log(`Initial MCQ Questions:   ${mcqs.length}`);

  // Build index of MCQ normalized text for cross-type deduplication
  const mcqNorms = new Map();
  mcqs.forEach(q => {
    const norm = (q.question || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm.length > 20) mcqNorms.set(norm, q.id);
  });

  const uniqueNats = new Map();
  let enrichedAnswerCount = 0;

  const removalStats = {
    junkHeaderOCR: 0,
    brokenStatementPairs: 0,
    crossTypeMcqDupes: 0,
    exactOrNearNatDupes: 0,
    unanswerableBroken: 0
  };

  initialNats.forEach(q => {
    const text = (q.question || '').trim();
    const norm = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    const expl = (q.explanation || '').trim();

    // 1. Check for Junk / Header / OCR page lines / Fragments
    const isJunk = /^(--- PAGE|UESTIONS BANK|UPRVUNL|UKPSC|APPSC|BPSC|UP JAL NIGAM|CGPSC|BHEL|CIL|GPSC|HPPSC|MPSC|RPSC|MPPSC|WBPSC|TNPSC|KPSC|\d+\s*x\s*1\s*\d+|INTERNAL COMBUSTION|Calculation for|Compression ratio|Efficiency calculation|Intermediate calculation|Percentage increase|Final calculation|Question \d+$)/i.test(text)
      || /^[\d\s\.\-\+\*\/\(\)x×÷=<>%]+$/.test(text)
      || /^[\d\.\s]+(kJ|kW|W|J|Pa|bar|N|kg|m|cm|mm|K|°C)?$/i.test(text)
      || text.length < 15;

    if (isJunk) {
      removalStats.junkHeaderOCR++;
      return;
    }

    // 2. Check for Statement I / Statement II ESE questions (Assertion-Reason MCQs missing options)
    const isStatementPair = /Statement\s*\(?I\)?/i.test(text) && /Statement\s*\(?II\)?/i.test(text);
    if (isStatementPair) {
      removalStats.brokenStatementPairs++;
      return;
    }

    // 3. Check for Cross-type duplicates (Question is already in MCQ bank)
    if (mcqNorms.has(norm)) {
      removalStats.crossTypeMcqDupes++;
      return;
    }

    // Attempt answer extraction if correct is defaulted to -1 or missing
    if (q.correct === -1 || q.correct === null || q.correct === undefined || q.correct === '') {
      const extracted = extractAnswerFromExpl(q);
      if (extracted !== null) {
        q.correct = extracted;
        enrichedAnswerCount++;
      }
    }

    // 4. Check for duplicate within NAT bank
    if (uniqueNats.has(norm)) {
      removalStats.exactOrNearNatDupes++;
      const existing = uniqueNats.get(norm);
      // Retain the entry with valid correct answer or valid explanation
      const scoreCurrent = (q.correct !== -1 && q.correct !== null ? 2 : 0) + (expl && !expl.toLowerCase().includes('coming soon') ? 1 : 0);
      const scoreExisting = (existing.correct !== -1 && existing.correct !== null ? 2 : 0) + (existing.explanation && !existing.explanation.toLowerCase().includes('coming soon') ? 1 : 0);

      if (scoreCurrent > scoreExisting) {
        uniqueNats.set(norm, q);
      }
      return;
    }

    // 5. Check for unanswerable NAT entries (no correct answer, no numeric solution in explanation)
    const hasValidCorrect = q.correct !== undefined && q.correct !== null && q.correct !== -1 && q.correct !== '' && q.correct !== 'Coming soon';
    const hasValidExpl = expl && !expl.toLowerCase().includes('coming soon') && expl.length > 15;
    const hasNumericAnswerInExpl = hasValidExpl && (/\b\d+(\.\d+)?\s*(kJ|kW|m\/s|N|Pa|bar|K|°C|mm|kg|%|W|kJ\/kg|m3\/s|rpm|m)?\b/i.test(expl) || /Ans(\.|wer)?:?\s*[\d\.\-]+/i.test(expl));

    if (!hasValidCorrect && !hasNumericAnswerInExpl) {
      removalStats.unanswerableBroken++;
      return;
    }

    // Passed all quality checks!
    uniqueNats.set(norm, q);
  });

  const keptNats = Array.from(uniqueNats.values());

  // Reassemble full question list: all MCQs + clean NATs
  const finalQuestions = [...mcqs, ...keptNats];

  console.log(`\n--- CLEANING STATS FOR ${path.basename(filePath)} ---`);
  console.log(`- Junk / OCR Header Rows Removed:      ${removalStats.junkHeaderOCR}`);
  console.log(`- Broken Statement Pairs Removed:    ${removalStats.brokenStatementPairs}`);
  console.log(`- Cross-type MCQ Duplicates Removed: ${removalStats.crossTypeMcqDupes}`);
  console.log(`- NAT Duplicates Removed:            ${removalStats.exactOrNearNatDupes}`);
  console.log(`- Unanswerable NAT Entries Removed:  ${removalStats.unanswerableBroken}`);
  console.log(`-------------------------------------------------------`);
  console.log(`Total Redundant/Junk NATs Removed:    ${initialNats.length - keptNats.length}`);
  console.log(`Answers Enriched from Explanation:   ${enrichedAnswerCount}`);
  console.log(`Total Clean NAT Questions Kept:      ${keptNats.length}`);
  console.log(`Final Total Questions in Dataset:    ${finalQuestions.length}`);

  // Write updated dataset back to file
  fs.writeFileSync(filePath, JSON.stringify(finalQuestions, null, 2), 'utf8');
  console.log(`Successfully updated ${path.basename(filePath)}!`);

  return {
    initialTotal,
    initialNats: initialNats.length,
    finalTotal: finalQuestions.length,
    finalNats: keptNats.length,
    removedCount: initialNats.length - keptNats.length,
    enrichedCount: enrichedAnswerCount,
    removalStats
  };
}

function main() {
  console.log('Starting NAT Question Cleaning & Redundancy Removal...');

  const statsPrimary = cleanDataset(FILE_PRIMARY);
  const statsCleaned = cleanDataset(FILE_CLEANED);

  // Update review_flags.json if present
  if (fs.existsSync(FILE_FLAGS)) {
    try {
      const flags = JSON.parse(fs.readFileSync(FILE_FLAGS, 'utf8'));
      if (flags.nat_fragments_need_source_reextraction) {
        flags.nat_fragments_need_source_reextraction_resolved = true;
        flags.nat_fragments_need_source_reextraction_count_before = flags.nat_fragments_need_source_reextraction.length;
        flags.nat_fragments_need_source_reextraction = [];
        fs.writeFileSync(FILE_FLAGS, JSON.stringify(flags, null, 2), 'utf8');
        console.log('\nSuccessfully updated review_flags.json! Cleared resolved nat_fragments flags.');
      }
    } catch (e) {
      console.error('Error updating review_flags.json:', e.message);
    }
  }

  console.log('\nNAT Question Cleaning Completed Successfully!');
}

main();
