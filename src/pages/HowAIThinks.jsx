import React from 'react';
import { Brain, Database, Cpu, Target, ArrowRight } from 'lucide-react';

export default function HowAIThinks() {
  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(45deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        How Mahi's AI Thinks
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '3rem' }}>
        A transparent look into the cognitive architecture powering your personalized learning experience.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Student Model */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Database size={32} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa', fontSize: '1.3rem' }}>1. Student Model</h3>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              Collects telemetry from every interaction: solve time, answer changes, confidence ratings, and correctness. This raw data forms the foundation of your unique learning profile.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={24} color="#475569" /></div>

        {/* Bayesian Knowledge Tracing */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Brain size={32} color="#8b5cf6" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#a78bfa', fontSize: '1.3rem' }}>2. Bayesian Knowledge Tracing (BKT)</h3>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              Tracks the probability that you have mastered specific concepts over time. It accounts for the chance of guessing correctly and the probability of slipping up despite knowing the concept.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={24} color="#475569" /></div>

        {/* Item Response Theory */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #ec4899', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Cpu size={32} color="#ec4899" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f472b6', fontSize: '1.3rem' }}>3. Item Response Theory (IRT)</h3>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              Evaluates the difficulty and discrimination power of each question relative to your estimated ability level. This ensures you are constantly challenged at the edge of your competence.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={24} color="#475569" /></div>

        {/* Decision Engine */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Target size={32} color="#10b981" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#34d399', fontSize: '1.3rem' }}>4. Decision Engine</h3>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              Synthesizes insights to recommend the exact next step: a stretch question, a mistake repair session, or revision for a decaying concept.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
