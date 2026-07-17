import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  doc,
  collection,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  getDocs,
  getDoc,
  query,
  where
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useScore } from './ScoreContext';
import { updateMasteryScore, classifyMistake, buildCompositeKey } from '../utils/adaptiveEngine';
import { scheduleReview } from '../utils/spacedRepetition';
import { validateAttemptTelemetry } from '../intelligence/telemetry/telemetrySchema';
import { applyDecay, migrateScoreToBKT } from '../intelligence/engines/bktEngine';

const UserDataContext = createContext();

export function useUserData() {
  return useContext(UserDataContext);
}

export function UserDataProvider({ children }) {
  const { user } = useAuth();
  const { recordAnswer } = useScore(); // Keep compatibility and XP system

  const [masteryScores, setMasteryScores] = useState({});
  const [mistakes, setMistakes] = useState({});
  const [spacedRepetition, setSpacedRepetition] = useState({});
  const [questionProgress, setQuestionProgress] = useState({});
  const [loading, setLoading] = useState(true);

  // Load and listen to user's adaptive data
  useEffect(() => {
    if (!user) {
      setMasteryScores({});
      setMistakes({});
      setSpacedRepetition({});
      setQuestionProgress({});
      setLoading(false);
      return;
    }

    // Auto-backfill attempts from completed tests or legacy arrays if questionProgress is empty
    const checkAndBackfill = async () => {
      try {
        const progressColRef = collection(db, 'users', user.uid, 'questionProgress');
        const progressSnap = await getDocs(progressColRef);
        
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const correctQs = userData.correctQuestions || [];
        const incorrectQs = userData.incorrectQuestions || [];
        
        // If they have less than 10 progress entries but might have completed tests or legacy arrays, backfill!
        if (progressSnap.size < 10 && (correctQs.length > 0 || incorrectQs.length > 0 || userData.totalAttempted > 0)) {
          console.log(`[Backfill] Starting telemetry reconstruction for user.`);
          
          // Load question data files dynamically to get details (topics/categories)
          const [me, qa, di, dilr, lr] = await Promise.all([
            import('../data/mechEngQuestions.js'),
            import('../data/quantsQuestions.js'),
            import('../data/dataInterpretationQuestions.js'),
            import('../data/dilrQuestions.js'),
            import('../data/logicalReasoningQuestions.js')
          ]);
          const allQs = [...me.default, ...qa.default, ...di.default, ...dilr.default, ...lr.default];
          
          const batchPromises = [];
          const processedQIds = new Set();

          // Helper to build key matching buildCompositeKey in adaptiveEngine
          const buildCompositeKey = (category, topic) => {
            return `${category || 'unknown'}_${topic || 'unknown'}`.replace(/\s+/g, '_');
          };

          // 1. Backfill from legacy arrays
          const migrateLegacyArrayItem = (qId, isCorrect) => {
            const qIdStr = qId.toString();
            if (processedQIds.has(qIdStr)) return;
            processedQIds.add(qIdStr);

            const quest = allQs.find(q => q.id.toString() === qIdStr);
            if (!quest) return;

            const progressRef = doc(db, 'users', user.uid, 'questionProgress', qIdStr);
            batchPromises.push(setDoc(progressRef, {
              status: isCorrect ? 'correct' : 'incorrect',
              attempts: 1,
              solveTimeMs: 45000,
              confidence: 'sure',
              updatedAt: new Date().toISOString()
            }, { merge: true }));

            const compositeKey = buildCompositeKey(quest.category, quest.topic);
            const masteryRef = doc(db, 'users', user.uid, 'masteryData', compositeKey);
            batchPromises.push(setDoc(masteryRef, {
              category: quest.category,
              topic: quest.topic,
              score: isCorrect ? 0.65 : 0.35,
              attempts: 1,
              correctCount: isCorrect ? 1 : 0,
              streak: isCorrect ? 1 : 0,
              lastAttempted: new Date().toISOString(),
              avgSolveTimeMs: 45000
            }, { merge: true }));

            if (!isCorrect) {
              const mistakeRef = doc(db, 'users', user.uid, 'mistakes', qIdStr);
              batchPromises.push(setDoc(mistakeRef, {
                questionId: quest.id,
                category: quest.category,
                topic: quest.topic,
                type: quest.type || 'MCQ',
                mistakeType: 'conceptual',
                firstIncorrectAt: new Date().toISOString(),
                lastIncorrectAt: new Date().toISOString(),
                timesIncorrect: 1,
                isResolved: false,
                resolvedAt: null,
                userNote: ''
              }, { merge: true }));
            }
          };

          correctQs.forEach(qId => migrateLegacyArrayItem(qId, true));
          incorrectQs.forEach(qId => migrateLegacyArrayItem(qId, false));

          // 2. Backfill from completed tests
          const testsColRef = collection(db, 'users', user.uid, 'tests');
          const testsSnap = await getDocs(testsColRef);
          
          testsSnap.forEach((testDoc) => {
            const testData = testDoc.data();
            const report = testData.report || [];
            
            report.forEach((rep) => {
              const qIdStr = rep.id.toString();
              if (processedQIds.has(qIdStr)) return;
              processedQIds.add(qIdStr);

              const quest = allQs.find(q => q.id.toString() === qIdStr);
              if (!quest) return;

              const progressRef = doc(db, 'users', user.uid, 'questionProgress', qIdStr);
              batchPromises.push(setDoc(progressRef, {
                status: rep.isCorrect ? 'correct' : 'incorrect',
                attempts: 1,
                solveTimeMs: rep.timeSpent ? rep.timeSpent * 1000 : 45000,
                confidence: rep.confidence || 'sure',
                updatedAt: testData.submittedAt || new Date().toISOString()
              }, { merge: true }));

              const compositeKey = buildCompositeKey(quest.category, quest.topic);
              const masteryRef = doc(db, 'users', user.uid, 'masteryData', compositeKey);
              batchPromises.push(setDoc(masteryRef, {
                category: quest.category,
                topic: quest.topic,
                score: rep.isCorrect ? 0.65 : 0.35,
                attempts: 1,
                correctCount: rep.isCorrect ? 1 : 0,
                streak: rep.isCorrect ? 1 : 0,
                lastAttempted: testData.submittedAt || new Date().toISOString(),
                avgSolveTimeMs: rep.timeSpent ? rep.timeSpent * 1000 : 45000
              }, { merge: true }));

              if (!rep.isCorrect) {
                const mistakeRef = doc(db, 'users', user.uid, 'mistakes', qIdStr);
                batchPromises.push(setDoc(mistakeRef, {
                  questionId: quest.id,
                  category: quest.category,
                  topic: quest.topic,
                  type: quest.type || 'MCQ',
                  mistakeType: 'conceptual',
                  firstIncorrectAt: testData.submittedAt || new Date().toISOString(),
                  lastIncorrectAt: testData.submittedAt || new Date().toISOString(),
                  timesIncorrect: 1,
                  isResolved: false,
                  resolvedAt: null,
                  userNote: ''
                }, { merge: true }));
              }
            });
          });

          if (batchPromises.length > 0) {
            await Promise.all(batchPromises);
            console.log(`[Backfill] Successfully backfilled ${processedQIds.size} question attempts.`);
            
            // Clean up legacy arrays to prevent repeated migration
            if (correctQs.length > 0 || incorrectQs.length > 0) {
              await updateDoc(userRef, {
                correctQuestions: [],
                incorrectQuestions: []
              });
            }
          }
        }
      } catch (err) {
        console.error("[Backfill] Error reconstructing history:", err);
      }
    };

    checkAndBackfill();

    setLoading(true);

    const userDocRef = doc(db, 'users', user.uid);
    const masteryColRef = collection(db, 'users', user.uid, 'masteryData');
    const mistakesColRef = collection(db, 'users', user.uid, 'mistakes');
    const spacedRepColRef = collection(db, 'users', user.uid, 'spacedRepetition');
    const progressColRef = collection(db, 'users', user.uid, 'questionProgress');

    // Listen to mastery scores
    const unsubMastery = onSnapshot(masteryColRef, (snapshot) => {
      const scores = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Decay logic
        if (data.lastAttempted && data.pKnow !== undefined) {
          const daysSinceLastReview = (Date.now() - new Date(data.lastAttempted).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastReview > 1) {
            data.pKnow = applyDecay(data.pKnow, daysSinceLastReview);
          }
        }
        
        // Migrate legacy scores
        if (data.pKnow === undefined && data.score !== undefined) {
          const migrated = migrateScoreToBKT(data.score);
          data.pKnow = migrated.pKnow;
          data.pLearn = migrated.pLearn;
          data.pGuess = migrated.pGuess;
          data.pSlip = migrated.pSlip;
          data.originalScore = data.score;
          data.migrated = true;
        }

        scores[doc.id] = data;
      });
      setMasteryScores(scores);
    }, (err) => console.error("Error syncing masteryData:", err));

    // Listen to mistakes (active ones)
    const unsubMistakes = onSnapshot(mistakesColRef, (snapshot) => {
      const mList = {};
      snapshot.forEach((doc) => {
        mList[doc.id] = doc.data();
      });
      setMistakes(mList);
    }, (err) => console.error("Error syncing mistakes:", err));

    // Listen to spaced repetition queue
    const unsubSpaced = onSnapshot(spacedRepColRef, (snapshot) => {
      const srQueue = {};
      snapshot.forEach((doc) => {
        srQueue[doc.id] = doc.data();
      });
      setSpacedRepetition(srQueue);
    }, (err) => console.error("Error syncing spacedRepetition:", err));

    // Listen to questionProgress
    const unsubProgress = onSnapshot(progressColRef, (snapshot) => {
      const prog = {};
      snapshot.forEach((doc) => {
        prog[doc.id] = doc.data();
      });
      setQuestionProgress(prog);
      setLoading(false);
    }, (err) => {
      console.error("Error syncing questionProgress:", err);
      setLoading(false);
    });

    return () => {
      unsubMastery();
      unsubMistakes();
      unsubSpaced();
      unsubProgress();
    };
  }, [user]);

  /**
   * Records a detailed answer response for adaptive algorithms.
   */
  const recordDetailedAnswer = async (question, isCorrect, solveTimeMs = 0, confidence = null, timeline = []) => {
    if (!user) return;

    const qId = question.id.toString();
    const compositeKey = buildCompositeKey(question.category, question.topic);

    let xpResult = null;
    // 1. Trigger the legacy ScoreContext answer logging (XP rewards, legacy progress)
    try {
      xpResult = await recordAnswer(question, isCorrect, solveTimeMs);
    } catch (e) {
      console.error("Error calling legacy recordAnswer:", e);
    }

    try {
      // 2. Fetch or initialize topic mastery
      const currentMasteryDoc = masteryScores[compositeKey] || {
        category: question.category || 'General',
        topic: question.topic || 'General',
        score: 0.5,
        pKnow: 0.5,
        pLearn: 0.1,
        pGuess: 0.2,
        pSlip: 0.1,
        attempts: 0,
        correctCount: 0,
        streak: 0,
        lastAttempted: null,
        avgSolveTimeMs: 0
      };

      const newStreak = isCorrect ? currentMasteryDoc.streak + 1 : 0;
      const newBktState = updateMasteryScore(currentMasteryDoc, isCorrect, solveTimeMs, newStreak, confidence);
      const newAttempts = currentMasteryDoc.attempts + 1;
      const newCorrectCount = isCorrect ? currentMasteryDoc.correctCount + 1 : currentMasteryDoc.correctCount;
      const newAvgSolveTime = currentMasteryDoc.avgSolveTimeMs 
        ? (currentMasteryDoc.avgSolveTimeMs * currentMasteryDoc.attempts + solveTimeMs) / newAttempts
        : solveTimeMs;

      const masteryRef = doc(db, 'users', user.uid, 'masteryData', compositeKey);
      await setDoc(masteryRef, {
        category: question.category || 'General',
        topic: question.topic || 'General',
        score: newBktState.pKnow, // legacy fallback mapping
        pKnow: newBktState.pKnow,
        pLearn: newBktState.pLearn,
        pGuess: newBktState.pGuess,
        pSlip: newBktState.pSlip,
        attempts: newAttempts,
        correctCount: newCorrectCount,
        streak: newStreak,
        lastAttempted: new Date().toISOString(),
        avgSolveTimeMs: Math.round(newAvgSolveTime)
      });

      // 3. Spaced Repetition log
      const spacedRef = doc(db, 'users', user.uid, 'spacedRepetition', qId);
      const currentSR = spacedRepetition[qId];

      if (!isCorrect) {
        // Reset or initialize spaced rep queue for this question
        const nextSchedule = scheduleReview(
          false,
          currentSR ? currentSR.interval : 0,
          currentSR ? currentSR.easeFactor : 2.5,
          currentSR ? currentSR.repetitionCount : 0
        );

        await setDoc(spacedRef, {
          questionId: question.id,
          interval: nextSchedule.interval,
          easeFactor: nextSchedule.easeFactor,
          nextReviewDate: nextSchedule.nextReviewDate,
          repetitionCount: nextSchedule.repetitionCount,
          lastReviewDate: Date.now(),
          lastResult: 'incorrect'
        });
      } else if (currentSR) {
        // Correct answer on a previously tracked question
        const nextSchedule = scheduleReview(
          true,
          currentSR.interval,
          currentSR.easeFactor,
          currentSR.repetitionCount
        );

        await setDoc(spacedRef, {
          questionId: question.id,
          interval: nextSchedule.interval,
          easeFactor: nextSchedule.easeFactor,
          nextReviewDate: nextSchedule.nextReviewDate,
          repetitionCount: nextSchedule.repetitionCount,
          lastReviewDate: Date.now(),
          lastResult: 'correct'
        });
      }

      // 4. Mistake Notebook logging
      const mistakeRef = doc(db, 'users', user.uid, 'mistakes', qId);
      const existingMistake = mistakes[qId];

      if (!isCorrect) {
        const selections = (timeline || []).filter(e => e.action === "select" || e.type === "OPTION_SELECTED");
        const hasSwitched = selections.length > 1;
        const autoClass = classifyMistake(question, null, solveTimeMs, confidence, hasSwitched);
        await setDoc(mistakeRef, {
          questionId: question.id,
          category: question.category || 'General',
          topic: question.topic || 'General',
          type: question.type || 'MCQ',
          mistakeType: existingMistake?.mistakeType || autoClass,
          userOverrideType: existingMistake?.userOverrideType || null,
          firstIncorrectAt: existingMistake?.firstIncorrectAt || new Date().toISOString(),
          lastIncorrectAt: new Date().toISOString(),
          timesIncorrect: increment(1),
          isResolved: false,
          resolvedAt: null,
          userNote: existingMistake?.userNote || ''
        }, { merge: true });
      } else if (existingMistake && !existingMistake.isResolved) {
        // Answered correctly, potentially resolve or increment progress
        // Note: Spaced Repetition manages revision cycle, we don't auto-resolve mistakes until user reviews
      }

      // 5. Extended detailed questionProgress log
      const progressRef = doc(db, 'users', user.uid, 'questionProgress', qId);
      await setDoc(progressRef, {
        status: isCorrect ? 'correct' : 'incorrect',
        attempts: increment(1),
        solveTimeMs,
        confidence,
        timeline: timeline || [],
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 6. Write canonical event-based telemetry document
      const attemptId = "ATT_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      const sessionId = sessionStorage.getItem('active_session_id') || 'PRACTICE_' + Date.now();
      
      const selections = (timeline || []).filter(e => e.action === "select" || e.type === "OPTION_SELECTED");
      const mappedEvents = (timeline || []).map(e => {
        if (e.action === "open") return { type: "QUESTION_OPENED", timestamp: e.time * 1000 + Date.now() - solveTimeMs };
        if (e.action === "select") return { type: "OPTION_SELECTED", option: e.optionIndex, timestamp: e.time * 1000 + Date.now() - solveTimeMs };
        if (e.action === "submit") return { type: "ANSWER_SUBMITTED", timestamp: e.time * 1000 + Date.now() - solveTimeMs };
        return e;
      });

      if (!mappedEvents.some(e => e.type === "QUESTION_OPENED")) {
        mappedEvents.unshift({ type: "QUESTION_OPENED", timestamp: Date.now() - solveTimeMs });
      }
      if (!mappedEvents.some(e => e.type === "ANSWER_SUBMITTED" || e.type === "TIMEOUT")) {
        mappedEvents.push({ type: "ANSWER_SUBMITTED", timestamp: Date.now() });
      }

      const attemptDoc = {
        schemaVersion: 1,
        attemptId,
        sessionId,
        userId: user.uid,
        questionId: question.id,
        questionVersion: 1,
        context: {
          mode: question.category === "Quantitative Aptitude" ? "APTITUDE" : "MECHANICAL_CORE",
          createdAt: Date.now()
        },
        timing: {
          openedAt: Date.now() - solveTimeMs,
          firstInteractionAt: selections.length > 0 ? (selections[0].time * 1000 + Date.now() - solveTimeMs) : null,
          submittedAt: Date.now(),
          activeTimeMs: solveTimeMs,
          idleTimeMs: 0
        },
        answer: {
          finalOption: selections.length > 0 ? (selections[selections.length - 1].optionIndex !== undefined ? selections[selections.length - 1].optionIndex : selections[selections.length - 1].option) : null,
          correctOption: question.correct,
          isCorrect
        },
        confidence: confidence || "Sure",
        events: mappedEvents
      };

      try {
        validateAttemptTelemetry(attemptDoc);
        const attemptRef = doc(db, 'users', user.uid, 'attempts', attemptId);
        const safeAttemptDoc = JSON.parse(JSON.stringify(attemptDoc, (k, v) => v === undefined ? null : v));
        await setDoc(attemptRef, safeAttemptDoc);
      } catch (validationErr) {
        console.error("Telemetry validation error, aborting attempts write:", validationErr);
      }

    } catch (error) {
      console.error("Error recording detailed answer:", error);
    }
    return xpResult;
  };

  /**
   * Manually override a mistake classification.
   */
  const updateMistakeType = async (questionId, newType) => {
    if (!user) return;
    const mistakeRef = doc(db, 'users', user.uid, 'mistakes', questionId.toString());
    try {
      await updateDoc(mistakeRef, {
        userOverrideType: newType
      });
    } catch (e) {
      console.error("Error updating mistake type:", e);
    }
  };

  /**
   * Mark a mistake as resolved.
   */
  const resolveMistake = async (questionId, resolved = true) => {
    if (!user) return;
    const mistakeRef = doc(db, 'users', user.uid, 'mistakes', questionId.toString());
    try {
      await updateDoc(mistakeRef, {
        isResolved: resolved,
        resolvedAt: resolved ? new Date().toISOString() : null
      });
    } catch (e) {
      console.error("Error resolving mistake:", e);
    }
  };

  /**
   * Save user note to a mistake.
   */
  const updateMistakeNote = async (questionId, note) => {
    if (!user) return;
    const mistakeRef = doc(db, 'users', user.uid, 'mistakes', questionId.toString());
    try {
      await updateDoc(mistakeRef, {
        userNote: note
      });
    } catch (e) {
      console.error("Error updating mistake note:", e);
    }
  };

  return (
    <UserDataContext.Provider value={{
      masteryScores,
      mistakes,
      spacedRepetition,
      questionProgress,
      loading,
      recordDetailedAnswer,
      updateMistakeType,
      resolveMistake,
      updateMistakeNote
    }}>
      {children}
    </UserDataContext.Provider>
  );
}
