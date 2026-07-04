// Simple automated test runner for assessment logic
const assert = require('assert');

console.log("============================================================");
console.log("Running Assessment Logic Automated Tests...");
console.log("============================================================");

// Test MSQ grading logic
function gradeMsq(correctArr, userArr) {
  return correctArr.length === userArr.length && correctArr.every(v => userArr.includes(v));
}

// Test NAT grading logic with tolerance
function gradeNat(correctVal, userVal, tolerance = 0.05) {
  return Math.abs(correctVal - userVal) <= tolerance;
}

// Test negative marking calculation
function calculateScore(questions, selectedOptions, isNegativeEnabled) {
  let score = 0;
  questions.forEach(q => {
    const ans = selectedOptions[q.id];
    if (ans === undefined || ans === '') return; // unattempted

    let isCorrect = false;
    if (q.type === 'MSQ') {
      isCorrect = gradeMsq(q.correct, ans);
    } else if (q.type === 'NAT') {
      isCorrect = gradeNat(parseFloat(q.correct), parseFloat(ans));
    } else {
      isCorrect = ans === q.correct;
    }

    if (isCorrect) {
      score += 1;
    } else if (isNegativeEnabled) {
      score -= (1/3);
    }
  });
  return parseFloat(score.toFixed(2));
}

try {
  // Test 1: MSQ check
  assert.strictEqual(gradeMsq([0, 1], [0, 1]), true, "MSQ should be correct when options match exactly");
  assert.strictEqual(gradeMsq([0, 1], [1, 0]), true, "MSQ order should not matter");
  assert.strictEqual(gradeMsq([0, 1], [0]), false, "MSQ should be incorrect if incomplete");
  assert.strictEqual(gradeMsq([0, 1], [0, 1, 2]), false, "MSQ should be incorrect if extra options selected");
  console.log("✓ Test 1: MSQ Grading Logic Passed");

  // Test 2: NAT check
  assert.strictEqual(gradeNat(12.5, 12.5), true, "NAT exact match should be correct");
  assert.strictEqual(gradeNat(12.5, 12.53), true, "NAT within 0.05 tolerance should be correct");
  assert.strictEqual(gradeNat(12.5, 12.47), true, "NAT within 0.05 tolerance should be correct");
  assert.strictEqual(gradeNat(12.5, 12.6), false, "NAT outside 0.05 tolerance should be incorrect");
  console.log("✓ Test 2: NAT Tolerant Grading Logic Passed");

  // Test 3: Score calculations with negative marking
  const testQuestions = [
    { id: 1, type: 'MCQ', correct: 1 }, // Correct = B (1)
    { id: 2, type: 'MSQ', correct: [0, 2] },
    { id: 3, type: 'NAT', correct: 5.7 }
  ];

  // Case A: All correct
  const answersAllCorrect = { 1: 1, 2: [0, 2], 3: '5.7' };
  assert.strictEqual(calculateScore(testQuestions, answersAllCorrect, true), 3.0, "Score should be 3 for 3 correct");

  // Case B: Some wrong, negative marking ON
  const answersSomeWrong = { 1: 1, 2: [0], 3: '5.7' }; // Q2 is incorrect
  assert.strictEqual(calculateScore(testQuestions, answersSomeWrong, true), 1.67, "Score should be 1.67 (2 correct - 0.33)");

  // Case C: Some wrong, negative marking OFF
  assert.strictEqual(calculateScore(testQuestions, answersSomeWrong, false), 2.0, "Score should be 2 for 2 correct when negative marking is disabled");

  console.log("✓ Test 3: Score & Negative Marking Logic Passed");

  console.log("\nALL TESTS PASSED SUCCESSFULLY! 🎉");
} catch (e) {
  console.error("❌ TEST FAILED:", e.message);
  process.exit(1);
}
