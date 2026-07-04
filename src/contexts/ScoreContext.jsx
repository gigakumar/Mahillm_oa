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

  const recordAnswer = async (questionId, isCorrect) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const progressRef = doc(db, 'users', user.uid, 'questionProgress', questionId.toString());
    
    try {
      // 1. Update overall XP and stats in root doc
      if (isCorrect) {
        await updateDoc(userRef, {
          totalAttempted: increment(1),
          totalCorrect: increment(1),
          xp: increment(10)
        });
      } else {
        await updateDoc(userRef, {
          totalAttempted: increment(1),
          xp: increment(2)
        });
      }

      // 2. Set sub-collection document progress
      await setDoc(progressRef, {
        status: isCorrect ? 'correct' : 'incorrect',
        updatedAt: new Date().toISOString()
      }, { merge: true });

    } catch (error) {
      console.error("Error updating score:", error);
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
