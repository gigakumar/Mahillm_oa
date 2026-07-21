/**
 * Test Hashmap & Wrong Question HashSet Utility
 *
 * Constructs a Hashmap for each test attempt and a HashSet of wrong question IDs
 * for each user. Aggregates wrong question sets to extract topic-level error frequencies
 * and identify the Most Wronged Topic(s) for the Topic Mastery Heatmap.
 */

export function buildTestHashMap(testHistory = [], questionProgress = {}, mistakes = {}, allQuestions = []) {
  const testMap = new Map(); // testId -> TestAttemptData
  const globalWrongTopicMap = new Map(); // topicName -> TopicMistakeSummary

  // Build quick metadata lookup map from question pool
  const questionMetaMap = new Map();
  if (Array.isArray(allQuestions)) {
    allQuestions.forEach(q => {
      if (q && q.id) {
        questionMetaMap.set(q.id.toString(), {
          id: q.id,
          topic: q.topic || 'General',
          category: q.category || 'General',
          question: q.question || '',
          difficulty: q.difficulty || 'MEDIUM'
        });
      }
    });
  }

  // 1. Process explicit test attempts from testHistory
  if (Array.isArray(testHistory) && testHistory.length > 0) {
    testHistory.forEach((t, idx) => {
      if (!t) return;
      const testId = t.id || `test_attempt_${idx + 1}`;
      const testTitle = t.title || t.testCategory || `Test Attempt #${idx + 1}`;
      const timestamp = t.completedAt || t.createdAt || new Date().toISOString();
      const wrongSet = new Set();
      const wrongTopicMap = new Map();
      const report = t.report || t.questions || [];

      report.forEach(q => {
        const qId = (q.id || q.questionId || '').toString();
        if (!q.isCorrect && q.isAttempted !== false && qId) {
          wrongSet.add(qId);
          const meta = questionMetaMap.get(qId) || { topic: q.topic || 'General', category: q.category || 'General' };
          const topic = meta.topic;
          wrongTopicMap.set(topic, (wrongTopicMap.get(topic) || 0) + 1);
        }
      });

      testMap.set(testId, {
        testId,
        testTitle,
        timestamp,
        totalQuestions: report.length || 0,
        wrongQuestionsSet: wrongSet, // HashSet of wrong question IDs
        wrongTopicMap,
        score: t.score !== undefined ? t.score : null,
        accuracy: t.accuracy !== undefined ? t.accuracy : null,
      });
    });
  }

  // 2. Synthesize test hashsets from user's active wrongQuestions (mistakes) and questionProgress
  const activeMistakesList = Object.values(mistakes || {});
  const progressList = Object.entries(questionProgress || {});

  if (activeMistakesList.length > 0 || progressList.length > 0) {
    const syntheticWrongSet = new Set();
    const syntheticTopicMap = new Map();

    activeMistakesList.forEach(m => {
      if (m && m.questionId) {
        const qId = m.questionId.toString();
        syntheticWrongSet.add(qId);
        const meta = questionMetaMap.get(qId) || { topic: m.topic || 'General', category: m.category || 'General' };
        const topic = meta.topic;
        syntheticTopicMap.set(topic, (syntheticTopicMap.get(topic) || 0) + (m.timesWrong || 1));
      }
    });

    progressList.forEach(([qId, prog]) => {
      if (prog && prog.status === 'incorrect') {
        syntheticWrongSet.add(qId.toString());
        const meta = questionMetaMap.get(qId.toString()) || { topic: prog.topic || 'General', category: prog.category || 'General' };
        const topic = meta.topic;
        syntheticTopicMap.set(topic, (syntheticTopicMap.get(topic) || 0) + 1);
      }
    });

    if (syntheticWrongSet.size > 0 && !testMap.has('practice_session_summary')) {
      testMap.set('practice_session_summary', {
        testId: 'practice_session_summary',
        testTitle: 'Adaptive Practice & Diagnostic Assessments',
        timestamp: new Date().toISOString(),
        totalQuestions: Math.max(progressList.length, syntheticWrongSet.size),
        wrongQuestionsSet: syntheticWrongSet,
        wrongTopicMap: syntheticTopicMap,
        score: null,
        accuracy: null
      });
    }
  }

  // 3. Aggregate all test hashsets into globalWrongTopicMap
  testMap.forEach((testData) => {
    testData.wrongQuestionsSet.forEach(qId => {
      const meta = questionMetaMap.get(qId) || { topic: 'General', category: 'General' };
      const topic = meta.topic;
      const category = meta.category;

      if (!globalWrongTopicMap.has(topic)) {
        globalWrongTopicMap.set(topic, {
          topic,
          category,
          totalWrong: 0,
          wrongQuestionsSet: new Set(),
          affectedTestsCount: 0,
          affectedTestIds: new Set()
        });
      }

      const topicData = globalWrongTopicMap.get(topic);
      topicData.totalWrong += 1;
      topicData.wrongQuestionsSet.add(qId);

      if (!topicData.affectedTestIds.has(testData.testId)) {
        topicData.affectedTestIds.add(testData.testId);
        topicData.affectedTestsCount += 1;
      }
    });
  });

  // Convert globalWrongTopicMap into sorted array of topic mistake rankings
  const rankedWrongTopics = Array.from(globalWrongTopicMap.values()).map(item => ({
    ...item,
    uniqueWrongQuestionsCount: item.wrongQuestionsSet.size,
    wrongQuestionIds: Array.from(item.wrongQuestionsSet)
  })).sort((a, b) => b.totalWrong - a.totalWrong || b.uniqueWrongQuestionsCount - a.uniqueWrongQuestionsCount);

  const mostWrongedTopic = rankedWrongTopics.length > 0 ? rankedWrongTopics[0] : null;

  return {
    testMap,                        // Map<testId, TestAttemptData>
    testList: Array.from(testMap.values()),
    globalWrongTopicMap,             // Map<topic, TopicMistakeData>
    rankedWrongTopics,              // Sorted array of topics by wrong count
    mostWrongedTopic,               // #1 most wronged topic
    totalWrongQuestionsAcrossTests: Array.from(testMap.values()).reduce((sum, t) => sum + t.wrongQuestionsSet.size, 0)
  };
}
