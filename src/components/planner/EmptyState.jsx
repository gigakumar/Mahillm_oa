import React from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Target, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWindowSize } from 'react-use'; // optional if they don't have it, I'll use window directly

export default function EmptyState() {
  const navigate = useNavigate();
  // We'll just use fixed window size or innerWidth
  const width = window.innerWidth || 1000;
  const height = window.innerHeight || 800;

  return (
    <div className="empty-queue-state glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <Confetti 
        width={width} 
        height={400} 
        recycle={false} 
        numberOfPieces={200}
        colors={['#6366f1', '#ec4899', '#10b981', '#f59e0b']}
      />
      
      <motion.div 
        initial={{ scale: 0 }} 
        animate={{ scale: 1 }} 
        transition={{ type: "spring", bounce: 0.5 }}
      >
        <PartyPopper className="w-16 h-16 text-indigo-400 mb-4" />
      </motion.div>
      
      <h4>You're ahead of schedule!</h4>
      <p>All clear & memory engine active. No concepts currently require urgent spaced-repetition review.</p>
      
      <motion.button 
        className="practice-more-btn mt-4" 
        onClick={() => navigate('/oa-practice')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Target className="w-4 h-4" /> Start Optional Practice
      </motion.button>
    </div>
  );
}
