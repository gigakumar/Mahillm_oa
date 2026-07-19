import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  doc,
  collection,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useScore } from './ScoreContext';
import { validateAttemptTelemetry } from '../intelligence/telemetry/telemetrySchema';

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
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [dashboardProgress, setDashboardProgress] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
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

    setLoading(true);

    const masteryColRef = collection(db, 'users', user.uid, 'masteryData');
    const mistakesColRef = collection(db, 'users', user.uid, 'wrongQuestions');
    const spacedRepColRef = collection(db, 'users', user.uid, 'spacedRepetition');
    const progressColRef = collection(db, 'users', user.uid, 'questionProgress');
    const testsColRef = collection(db, 'users', user.uid, 'tests');
    const dashboardSummaryRef = doc(db, 'users', user.uid, 'dashboard', 'summary');
    const dashboardProgressRef = doc(db, 'users', user.uid, 'dashboard', 'progress');

    // Listen to mastery scores
    const unsubMastery = onSnapshot(masteryColRef, (snapshot) => {
      const scores = {};
      snapshot.forEach((doc) => {
        scores[doc.id] = doc.data();
      });
      setMasteryScores(scores);
    }, (err) => console.error("Error syncing masteryData:", err));

    // Listen to mistakes (active ones) in user's wrongQuestions subcollection
    const unsubMistakes = onSnapshot(mistakesColRef, (snapshot) => {
      const mList = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        mList[data.questionId] = data; // map by questionId, not doc.id
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
    }, (err) => {
      console.error("Error syncing questionProgress:", err);
    });

    // Listen to tests
    const unsubTests = onSnapshot(testsColRef, (snapshot) => {
      const tList = [];
      snapshot.forEach((doc) => {
        tList.push({ id: doc.id, ...doc.data() });
      });
      setTestHistory(tList);
      setLoading(false);
    }, (err) => {
      console.error("Error syncing testHistory:", err);
      setLoading(false);
    });

    // Listen to dashboard summary
    const unsubSummary = onSnapshot(dashboardSummaryRef, (docSnap) => {
      if (docSnap.exists()) {
        setDashboardSummary(docSnap.data());
      }
    }, (err) => console.error("Error syncing dashboard summary:", err));

    // Listen to dashboard progress
    const unsubDashProgress = onSnapshot(dashboardProgressRef, (docSnap) => {
      if (docSnap.exists()) {
        setDashboardProgress(docSnap.data());
      }
    }, (err) => console.error("Error syncing dashboard progress:", err));

    return () => {
      unsubMastery();
      unsubMistakes();
      unsubSpaced();
      unsubProgress();
      unsubTests();
      unsubSummary();
      unsubDashProgress();
    };
  }, [user]);

  /**
   * Records a detailed answer response for adaptive algorithms.
   */
  const recordDetailedAnswer = useCallback(async (question, isCorrect, solveTimeMs = 0, confidence = null, timeline = []) => {
    if (!user) return;

    const qId = question.id.toString();

    let xpResult = null;
    // 1. Trigger the legacy ScoreContext answer logging (XP rewards, legacy progress)
    try {
      xpResult = await recordAnswer(question, isCorrect, solveTimeMs);
    } catch (e) {
      console.error("Error calling legacy recordAnswer:", e);
    }

    try {
      // 2. Write canonical event-based telemetry document
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
        // Denormalised for Cloud Function processors (no secondary lookup needed)
        topic: question.topic || 'General',
        category: question.category || 'General',
        context: {
          mode: question.category === "Quantitative Aptitude" ? "APTITUDE" : "MECHANICAL_CORE",
          topic: question.topic || 'General',
          category: question.category || 'General',
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

        // Client-side Mistake Processing Fallback (Bypassing Firebase Functions for Spark plan)
        if (!isCorrect) {
          const mistakeRef = doc(db, 'users', user.uid, 'wrongQuestions', question.id.toString());
          const topic = question.topic || 'General';
          const category = question.category || 'General';
          
          await setDoc(mistakeRef, {
            userId: user.uid,
            questionId: question.id,
            topic,
            category,
            mistakeCount: 1, // simplified for client-side
            timesIncorrect: 1,
            isResolved: false,
            firstMistakeAt: new Date().toISOString(),
            firstIncorrectAt: new Date().toISOString(),
            lastMistakeAt: new Date().toISOString(),
            lastIncorrectAt: new Date().toISOString(),
            autoClassification: "needs_review"
          }, { merge: true }); // merge to preserve existing data and increment counts if possible (though we'd need a transaction to truly increment, merge is fine for a fallback)
        }

        // Client-side BKT / MasteryData Fallback (Bypassing Firebase Functions for Spark plan)
        const topic = question.topic || 'General';
        const category = question.category || 'General';
        const docKey = `${category}__${topic}`.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const masteryRef = doc(db, 'users', user.uid, 'masteryData', docKey);
        
        try {
          await runTransaction(db, async (transaction) => {
            const mDoc = await transaction.get(masteryRef);
            let pL = 0.1; // default pL0
            let attemptsCount = 0;
            let correctCount = 0;
            
            if (mDoc.exists()) {
              const mData = mDoc.data();
              pL = mData.probabilityKnown || mData.score || 0.1;
              attemptsCount = mData.attemptsCount || mData.attempts || 0;
              correctCount = mData.correctCount || 0;
            }
            
            // BKT Update math:
            const pGuess = 0.25;
            const pSlip = 0.2;
            const pTransit = 0.1;
            
            const pLearn = isCorrect
              ? (pL * (1 - pSlip)) / (pL * (1 - pSlip) + (1 - pL) * pGuess)
              : (pL * pSlip) / (pL * pSlip + (1 - pL) * (1 - pGuess));
              
            const newPL = pLearn + (1 - pLearn) * pTransit;
            const boundedPL = Math.max(0.01, Math.min(0.99, newPL));
            
            transaction.set(masteryRef, {
              topic,
              category,
              probabilityKnown: boundedPL,
              score: boundedPL,
              attemptsCount: attemptsCount + 1,
              attempts: attemptsCount + 1,
              correctCount: isCorrect ? correctCount + 1 : correctCount,
              lastUpdated: new Date().toISOString()
            }, { merge: true });
          });
        } catch (masteryErr) {
          console.error("Error updating client-side BKT mastery:", masteryErr);
        }
      } catch (validationErr) {
        console.error("Telemetry validation error, aborting attempts write:", validationErr);
      }

    } catch (error) {
      console.error("Error recording detailed answer:", error);
    }
    return xpResult;
  }, [user, recordAnswer]);

  /**
   * Manually override a mistake classification.
   */
  const updateMistakeType = async (questionId, newType) => {
    if (!user) return;
    const mistakeRef = doc(db, 'users', user.uid, 'wrongQuestions', questionId.toString());
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
    const mistakeRef = doc(db, 'users', user.uid, 'wrongQuestions', questionId.toString());
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
    const mistakeRef = doc(db, 'users', user.uid, 'wrongQuestions', questionId.toString());
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
      dashboardSummary,
      dashboardProgress,
      testHistory,
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
