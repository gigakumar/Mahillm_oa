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
        scores[doc.id] = doc.data();
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

    // 1. Trigger the legacy ScoreContext answer logging (XP rewards, legacy progress)
    try {
      await recordAnswer(question.id, isCorrect);
    } catch (e) {
      console.error("Error calling legacy recordAnswer:", e);
    }

    try {
      // 2. Fetch or initialize topic mastery
      const currentMasteryDoc = masteryScores[compositeKey] || {
        category: question.category,
        topic: question.topic,
        score: 0.5,
        attempts: 0,
        correctCount: 0,
        streak: 0,
        lastAttempted: null,
        avgSolveTimeMs: 0
      };

      const newStreak = isCorrect ? currentMasteryDoc.streak + 1 : 0;
      const newScore = updateMasteryScore(currentMasteryDoc.score, isCorrect, solveTimeMs, newStreak);
      const newAttempts = currentMasteryDoc.attempts + 1;
      const newCorrectCount = isCorrect ? currentMasteryDoc.correctCount + 1 : currentMasteryDoc.correctCount;
      const newAvgSolveTime = currentMasteryDoc.avgSolveTimeMs 
        ? (currentMasteryDoc.avgSolveTimeMs * currentMasteryDoc.attempts + solveTimeMs) / newAttempts
        : solveTimeMs;

      const masteryRef = doc(db, 'users', user.uid, 'masteryData', compositeKey);
      await setDoc(masteryRef, {
        category: question.category,
        topic: question.topic,
        score: newScore,
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
        const autoClass = classifyMistake(question, null, solveTimeMs, confidence);
        await setDoc(mistakeRef, {
          questionId: question.id,
          category: question.category,
          topic: question.topic,
          type: question.type,
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
        attempts: increment(1),
        solveTimeMs,
        confidence,
        timeline: timeline || [],
        updatedAt: new Date().toISOString()
      }, { merge: true });

    } catch (error) {
      console.error("Error recording detailed answer:", error);
    }
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
