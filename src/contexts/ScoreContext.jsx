import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
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

  const recordAnswer = async (isCorrect) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    
    try {
      await updateDoc(userRef, {
        totalAttempted: increment(1),
        totalCorrect: isCorrect ? increment(1) : increment(0),
        xp: isCorrect ? increment(10) : increment(2) // 10 XP for correct, 2 XP for trying
      });
    } catch (error) {
      console.error("Error updating score:", error);
    }
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
    <ScoreContext.Provider value={{ scoreData, recordAnswer, toggleBookmark, loading }}>
      {children}
    </ScoreContext.Provider>
  );
}
