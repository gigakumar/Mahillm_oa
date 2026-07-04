const fs = require('fs');
const path = require('path');

const DB_EXPORT_PATH = '/Users/harsh/Desktop/MahiLLM/ingestion-pipeline/db_export.json';
const DATA_DIR = '/Users/harsh/Desktop/MahiLLM/mech-prep-app/src/data';

async function main() {
  const dbData = JSON.parse(fs.readFileSync(DB_EXPORT_PATH, 'utf8'));
  console.log(`Loaded ${dbData.length} questions from db_export.json`);

  const meQuestions = [];
  const qaQuestions = [];
  const diQuestions = [];
  const dilrQuestions = [];
  const lrQuestions = [];

  let meId = 1;
  let qaId = 20000;
  let diId = 30000;
  let dilrId = 40000;
  let lrId = 50000;

  const letterToIdx = { A: 0, B: 1, C: 2, D: 3, a: 0, b: 1, c: 2, d: 3 };

  for (const dq of dbData) {
    const subject = dq.subject;
    const topic = dq.topic;
    const subtopic = dq.subtopic;

    let optsDict = {};
    try {
      optsDict = JSON.parse(dq.options);
    } catch (e) {}

    let options = [];
    if (dq.question_type === 'MCQ' || dq.question_type === 'MSQ') {
      options = [
        optsDict.A || '',
        optsDict.B || '',
        optsDict.C || '',
        optsDict.D || ''
      ].map(o => o.trim()).filter(Boolean);
    }

    if (options.length === 0) {
      options = ['Option A', 'Option B', 'Option C', 'Option D'];
    }

    // NAT correct answers can be numbers, so let's handle correct index or value
    let correct = letterToIdx[dq.correct_answer] !== undefined ? letterToIdx[dq.correct_answer] : 0;
    
    // For MSQ correct answers can be arrays, let's keep it simple or parse arrays
    let correctVal = correct;
    if (dq.question_type === 'MSQ') {
      // If correct_answer has multiple characters e.g. "AB", map to [0, 1]
      correctVal = [];
      const ansStr = dq.correct_answer || '';
      for (let char of ansStr.toUpperCase()) {
        if (letterToIdx[char] !== undefined) {
          correctVal.push(letterToIdx[char]);
        }
      }
      if (correctVal.length === 0) correctVal = [0];
    } else if (dq.question_type === 'NAT') {
      // NAT correct is the numeric value
      const parsedAns = parseFloat(dq.correct_answer);
      correctVal = isNaN(parsedAns) ? 12.5 : parsedAns;
    }

    let difficulty = dq.difficulty_tier || 'Medium';
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      difficulty = 'Medium';
    }

    const reactQ = {
      id: 0,
      question: dq.question_text,
      options: options,
      correct: correctVal,
      explanation: dq.solution || '',
      contextHtml: (() => {
        const ctx = dq.review_reason || '';
        const diffTiers = ['undergraduate_advanced', 'undergraduate_introductory', 'high_school', 'middle_school', 'graduate'];
        return diffTiers.includes(ctx.trim()) ? '' : ctx;
      })(),
      difficulty: difficulty,
      topic: topic || 'General',
      category: '',
      type: dq.question_type || 'MCQ',
      originType: dq.origin_type || 'legacy_unknown',
      templateClusterId: dq.template_cluster_id || '',
      oaRelevanceScore: dq.oa_relevance_score || 60.0,
      qualityScore: dq.quality_score || 90.0,
      validationStatus: dq.validation_status || 'legacy_passed',
      sourceName: dq.source_name || '',
      sourceTier: dq.source_tier || '',
      verifiedPyq: dq.verified_pyq || false
    };

    if (subject === 'Mechanical Engineering') {
      meId++;
      reactQ.id = meId;
      reactQ.category = 'Mechanical Engineering';
      meQuestions.push(reactQ);
    } else if (subject === 'Quantitative Aptitude') {
      qaId++;
      reactQ.id = qaId;
      reactQ.category = 'Quantitative Aptitude';
      qaQuestions.push(reactQ);
    } else if (subject === 'Data Interpretation') {
      diId++;
      reactQ.id = diId;
      reactQ.category = 'Data Interpretation';
      diQuestions.push(reactQ);
    } else if (subject === 'DILR') {
      dilrId++;
      reactQ.id = dilrId;
      reactQ.category = 'DILR';
      dilrQuestions.push(reactQ);
    } else if (subject === 'Logical Reasoning') {
      lrId++;
      reactQ.id = lrId;
      reactQ.category = 'Logical Reasoning';
      lrQuestions.push(reactQ);
    } else {
      // Fallback
      qaId++;
      reactQ.id = qaId;
      reactQ.category = 'Quantitative Aptitude';
      qaQuestions.push(reactQ);
    }
  }

  // Include previous DILR questions scraped from IndiaBix if we want to retain them
  // Let's print counts
  console.log(`Ingested counts:`);
  console.log(`  Mechanical Engineering: ${meQuestions.length}`);
  console.log(`  Quantitative Aptitude: ${qaQuestions.length}`);
  console.log(`  Data Interpretation: ${diQuestions.length}`);
  console.log(`  DILR: ${dilrQuestions.length}`);
  console.log(`  Logical Reasoning: ${lrQuestions.length}`);

  function writeJsFile(filePath, data) {
    const jsContent = `export default ${JSON.stringify(data, null, 2)};\n`;
    fs.writeFileSync(filePath, jsContent, 'utf8');
  }

  writeJsFile(path.join(DATA_DIR, 'mechEngQuestions.js'), meQuestions);
  writeJsFile(path.join(DATA_DIR, 'quantsQuestions.js'), qaQuestions);
  writeJsFile(path.join(DATA_DIR, 'dataInterpretationQuestions.js'), diQuestions);
  writeJsFile(path.join(DATA_DIR, 'dilrQuestions.js'), dilrQuestions);
  writeJsFile(path.join(DATA_DIR, 'logicalReasoningQuestions.js'), lrQuestions);

  // Calculate metadata
  const totalCount = meQuestions.length + qaQuestions.length + diQuestions.length + dilrQuestions.length + lrQuestions.length;
  const generatedCount = dbData.filter(dq => dq.question_id.startsWith("gen_")).length;
  const verifiedCount = totalCount - generatedCount;

  const metadata = {
    totalCount: totalCount,
    categories: {
      'Mechanical Engineering': { count: meQuestions.length, emoji: '🔩' },
      'Quantitative Aptitude': { count: qaQuestions.length, emoji: '🧮' },
      'Data Interpretation': { count: diQuestions.length, emoji: '📊' },
      'DILR': { count: dilrQuestions.length, emoji: '🧩' },
      'Logical Reasoning': { count: lrQuestions.length, emoji: '🧠' }
    },
    generatedPercentage: parseFloat((generatedCount / totalCount * 100).toFixed(2)),
    externallyVerifiedPercentage: parseFloat((verifiedCount / totalCount * 100).toFixed(2))
  };

  writeJsFile(path.join(DATA_DIR, 'metadata.js'), metadata);
  console.log(`Generated metadata.js with totalCount=${totalCount}`);

  // Remove old graphQuestions.js if it exists to clean up
  const oldGraphFile = path.join(DATA_DIR, 'graphQuestions.js');
  if (fs.existsSync(oldGraphFile)) {
    fs.unlinkSync(oldGraphFile);
    console.log(`Removed deprecated graphQuestions.js`);
  }

  console.log(`Merge completed successfully!`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
