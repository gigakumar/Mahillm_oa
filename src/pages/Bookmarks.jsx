import React, { useState, useEffect } from 'react';
import { useScore } from '../contexts/ScoreContext';
import { useUserData } from '../contexts/UserDataContext';
import { Bookmark, Search, Trash2, Zap, ArrowRight, Sparkles, CheckCircle, BookOpen, AlertTriangle } from 'lucide-react';
import MathRenderer from '../components/MathRenderer';
import { useNavigate } from 'react-router-dom';
import './Bookmarks.css';

const SUBJECTS = ['All', 'Thermodynamics', 'Strength of Materials', 'Fluid Mechanics', 'Heat Transfer', 'Manufacturing Engineering', 'Quantitative Aptitude'];

export default function Bookmarks() {
  const navigate = useNavigate();
  const { scoreData, toggleBookmark } = useScore();
  const { questionProgress } = useUserData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [bookmarkedList, setBookmarkedList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load bookmarked questions details from JSON question pools
  useEffect(() => {
    async function loadBookmarkedDetails() {
      setLoading(true);
      const bookmarkedIds = scoreData?.bookmarkedQuestions || [];

      if (bookmarkedIds.length === 0) {
        setBookmarkedList([]);
        setLoading(false);
        return;
      }

      try {
        const [me, qa, di, dilr, lr] = await Promise.all([
          fetch('/data/mechEngQuestions.json').then(r => r.json()),
          fetch('/data/quantsQuestions.json').then(r => r.json()),
          fetch('/data/dataInterpretationQuestions.json').then(r => r.json()),
          fetch('/data/dilrQuestions.json').then(r => r.json()),
          fetch('/data/logicalReasoningQuestions.json').then(r => r.json())
        ]);

        const allQs = [...me, ...qa, ...di, ...dilr, ...lr];
        const matched = allQs.filter(q => bookmarkedIds.includes(q.id) || bookmarkedIds.includes(q.id.toString()));

        setBookmarkedList(matched);
      } catch (err) {
        console.error('Error loading bookmarked questions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBookmarkedDetails();
  }, [scoreData?.bookmarkedQuestions]);

  const filteredBookmarks = bookmarkedList.filter(q => {
    const subj = q.subject || q.category || 'Mechanical Engineering';
    const matchesSubj = selectedSubject === 'All' || subj === selectedSubject;
    const matchesSearch = searchQuery.trim() === '' ||
      (q.question && q.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubj && matchesSearch;
  });

  const handlePracticeQuestion = (category, topic) => {
    navigate(`/oa-practice?cat=${encodeURIComponent(category || 'Mechanical Engineering')}&topic=${encodeURIComponent(topic || '')}`);
  };

  return (
    <div className="page-content bookmarks-page">
      <header className="bm-header card">
        <div className="bm-header-left">
          <div className="bm-badge">
            <Bookmark size={14} className="text-amber-400" />
            <span>Saved Revision Bank</span>
          </div>
          <h1>Starred PYQs & Bookmarked Questions 🔖</h1>
          <p>
            Review questions you saved for revision across practice drills, mock tests, and diagnostic sessions.
          </p>
        </div>

        <div className="bm-count-chip">
          <span className="bm-count-num">{bookmarkedList.length}</span>
          <span className="bm-count-lbl">Saved Questions</span>
        </div>
      </header>

      {/* Filter and Search Controls */}
      <div className="bm-controls card">
        <div className="bm-search">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search saved questions or concepts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bm-pills">
          {SUBJECTS.map(subj => (
            <button
              key={subj}
              className={`pill ${selectedSubject === subj ? 'active' : ''}`}
              onClick={() => setSelectedSubject(subj)}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="card empty-bm" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading saved questions...</p>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="card empty-bm">
          <Bookmark size={40} className="text-slate-600 mb-3" />
          <h3>No Bookmarked Questions Found</h3>
          <p>Click the bookmark icon 🔖 on any practice question to save it here for fast revision.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/oa-practice')}>
            <Sparkles size={16} /> Explore Practice Questions
          </button>
        </div>
      ) : (
        <div className="bm-questions-grid">
          {filteredBookmarks.map(q => {
            const subj = q.subject || q.category || 'Mechanical Engineering';
            const topic = q.topic || 'General Practice';
            return (
              <div key={q.id} className="bm-question-card card">
                <div className="bm-card-header">
                  <div className="bm-tags-row">
                    <span className="bm-subj-tag">{subj}</span>
                    <span className="bm-topic-tag">{topic}</span>
                  </div>

                  <button
                    className="bm-remove-btn"
                    onClick={() => toggleBookmark(q.id)}
                    title="Remove from bookmarks"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="bm-question-body">
                  <MathRenderer math={q.question || q.text} />
                </div>

                {/* Options Preview */}
                {Array.isArray(q.options) && (
                  <div className="bm-options-preview">
                    {q.options.map((opt, idx) => {
                      const isCorrect = idx === (q.correctAnswer ?? q.correct ?? 0);
                      return (
                        <div key={idx} className={`bm-opt-item ${isCorrect ? 'correct' : ''}`}>
                          <span className="opt-key">{String.fromCharCode(65 + idx)}</span>
                          <span className="opt-val">{opt}</span>
                          {isCorrect && <CheckCircle size={14} className="ml-auto text-emerald-400" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="bm-exp-box">
                    <strong>Solution Note:</strong>
                    <MathRenderer math={q.explanation} />
                  </div>
                )}

                <div className="bm-card-footer">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handlePracticeQuestion(subj, topic)}
                  >
                    <Zap size={14} /> Practice Topic Drills
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
