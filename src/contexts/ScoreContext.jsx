import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const ScoreContext = createContext();

export function useScore() {
  return useContext(ScoreContext);
}

export function ScoreProvider({ children }) {
  const { user } = useAuth();
  const [scoreData, setScoreData] = useState({
    xp: 0,
    totalAttempted: 0,
    totalCorrect: 0,
    accuracy: 0,
    bookmarked: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setScoreData({ xp: 0, totalAttempted: 0, totalCorrect: 0, accuracy: 0, bookmarked: [] });
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScoreData({
          xp: data.xp || 0,
          totalAttempted: data.totalAttempted || 0,
          totalCorrect: data.totalCorrect || 0,
          accuracy: data.totalAttempted ? Math.round((data.totalCorrect / data.totalAttempted) * 100) : 0,
          bookmarked: data.bookmarked || []
        });
      } else {
        // Initialize new user
        setDoc(userRef, {
          email: user.email,
          xp: 0,
          totalAttempted: 0,
          totalCorrect: 0,
          bookmarked: [],
          createdAt: new Date().toISOString()
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to score:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const recordAnswer = async (questionOrId, isCorrect, solveTimeMs = 0) => {
    if (!user) return null;
    
    let questionId = questionOrId;
    let difficulty = 'easy';
    
    if (questionOrId && typeof questionOrId === 'object') {
      questionId = questionOrId.id;
      difficulty = questionOrId.difficulty || 'easy';
    }
    
    const questionIdStr = questionId.toString();
    const userRef = doc(db, 'users', user.uid);
    const progressRef = doc(db, 'users', user.uid, 'questionProgress', questionIdStr);
    
    try {
      // Get current user doc to compute streak bonuses
      const userSnap = await getDoc(userRef);
      let currentStreak = 0;
      if (userSnap.exists()) {
        currentStreak = userSnap.data().streak || 0;
      }
      
      let xpEarned = 0;
      let newStreak = 0;
      
      if (isCorrect) {
        newStreak = currentStreak + 1;
        
        // 1. Base XP
        xpEarned += 10;
        
        // 2. Difficulty Multiplier
        if (difficulty === 'hard') {
          xpEarned += 15;
        } else if (difficulty === 'medium') {
          xpEarned += 5;
        }
        
        // 3. Speed Bonus (< 25 seconds)
        if (solveTimeMs > 0 && solveTimeMs < 25000) {
          xpEarned += 5;
        }
        
        // 4. Streak Milestones & Momentum
        if (newStreak % 5 === 0) {
          xpEarned += 20; // Big milestone bonus
        } else if (newStreak > 1) {
          xpEarned += Math.min(newStreak, 10); // Momentum bonus
        }
      } else {
        newStreak = 0;
        xpEarned += 2; // Participation XP
      }
      
      // Update Firestore user document
      const updates = {
        totalAttempted: increment(1),
        xp: increment(xpEarned),
        streak: newStreak
      };
      
      if (isCorrect) {
        updates.totalCorrect = increment(1);
      }
      
      await updateDoc(userRef, updates);

      // Set sub-collection document progress
      await setDoc(progressRef, {
        status: isCorrect ? 'correct' : 'incorrect',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return {
        xpEarned,
        newStreak,
        isCorrect
      };
    } catch (error) {
      console.error("Error updating score:", error);
      return null;
    }
  };

  const getQuestionsProgress = async (questionIds) => {
    if (!user || !questionIds || questionIds.length === 0) return {};
    const progressMap = {};
    
    try {
      // Query individual documents in parallel (capped at 50 to match quiz size)
      const promises = questionIds.map(async (id) => {
        const progressRef = doc(db, 'users', user.uid, 'questionProgress', id.toString());
        const docSnap = await getDoc(progressRef);
        if (docSnap.exists()) {
          progressMap[id] = docSnap.data().status;
        }
      });
      await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching questions progress:", error);
    }
    return progressMap;
  };

  const toggleBookmark = async (questionId) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const newBookmarks = scoreData.bookmarked.includes(questionId)
      ? scoreData.bookmarked.filter(id => id !== questionId)
      : [...scoreData.bookmarked, questionId];
      
    try {
      await updateDoc(userRef, { bookmarked: newBookmarks });
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };

  return (
    <ScoreContext.Provider value={{ scoreData, recordAnswer, getQuestionsProgress, toggleBookmark, loading }}>
      {children}
    </ScoreContext.Provider>
  );
}
