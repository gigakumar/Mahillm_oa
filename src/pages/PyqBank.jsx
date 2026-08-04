import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Sparkles, Award, Zap, CheckCircle2, Bookmark, ArrowRight } from 'lucide-react';
import MathRenderer from '../components/MathRenderer';
import { useScore } from '../contexts/ScoreContext';
import './PyqBank.css';

const YEARS = ['All Years', '2025', '2024', '2023', '2022', '2021'];
const SUBJECTS = ['All Subjects', 'Thermodynamics', 'Strength of Materials', 'Fluid Mechanics', 'Heat Transfer', 'Manufacturing Engineering', 'Quantitative Aptitude'];

export default function PyqBank() {
  const navigate = useNavigate();
  const { scoreData, toggleBookmark } = useScore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [pyqList, setPyqList] = useState([]);
  const [loading, setLoading] = useState(true);

  const bookmarkedIds = scoreData?.bookmarkedQuestions || [];

  useEffect(() => {
    async function loadPyqs() {
      setLoading(true);
      try {
        const [me, qa] = await Promise.all([
          fetch('/data/mechEngQuestions.json').then(r => r.json()),
          fetch('/data/quantsQuestions.json').then(r => r.json())
        ]);

        const combined = [...me, ...qa];
        setPyqList(combined);
      } catch (err) {
        console.error('Error loading PYQ data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPyqs();
  }, []);

  const filteredPyqs = pyqList.filter(q => {
    const subj = q.subject || q.category || 'Mechanical Engineering';
    const matchesSubj = selectedSubject === 'All Subjects' || subj === selectedSubject;
    const matchesSearch = searchQuery.trim() === '' ||
      (q.question && q.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubj && matchesSearch;
  });

  return (
    <div className="page-content pyq-bank-page">
      <header className="pyq-header card">
        <div className="pyq-badge">
          <BookOpen size={14} className="text-amber-400" />
          <span>Official GATE ME Question Bank</span>
        </div>
        <h1>GATE PYQ Question Bank & Solution Explorer 📜</h1>
        <p>
          Search official GATE Mechanical Engineering past year questions, verify LaTeX step-by-step solutions, and bookmark key questions.
        </p>
      </header>

      {/* Filter and Search Bar */}
      <div className="pyq-controls card">
        <div className="pyq-search">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search PYQ concepts, equations, or topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="pyq-pills-row">
          <div className="pyq-pills">
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
      </div>

      {/* PYQ Cards Grid */}
      {loading ? (
        <div className="card empty-pyq" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading PYQ Question Bank...</p>
        </div>
      ) : (
        <div className="pyq-grid">
          {filteredPyqs.slice(0, 30).map(q => {
            const isBookmarked = bookmarkedIds.includes(q.id) || bookmarkedIds.includes(q.id.toString());
            const subj = q.subject || q.category || 'Mechanical Engineering';
            const topic = q.topic || 'Core Mechanical';

            return (
              <div key={q.id} className="pyq-card card">
                <div className="pyq-card-top">
                  <div className="pyq-tags">
                    <span className="pyq-subj-badge">{subj}</span>
                    <span className="pyq-topic-badge">{topic}</span>
                  </div>

                  <button
                    className={`pyq-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                    onClick={() => toggleBookmark(q.id)}
                    title={isBookmarked ? 'Bookmarked' : 'Bookmark Question'}
                  >
                    <Bookmark size={16} fill={isBookmarked ? 'var(--warning)' : 'none'} color={isBookmarked ? 'var(--warning)' : 'var(--text-secondary)'} />
                  </button>
                </div>

                <div className="pyq-q-body">
                  <MathRenderer math={q.question || q.text} />
                </div>

                {Array.isArray(q.options) && (
                  <div className="pyq-options-grid">
                    {q.options.map((opt, idx) => {
                      const isCorrect = idx === (q.correctAnswer ?? q.correct ?? 0);
                      return (
                        <div key={idx} className={`pyq-opt ${isCorrect ? 'correct' : ''}`}>
                          <span className="opt-key">{String.fromCharCode(65 + idx)}</span>
                          <span className="opt-val">{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.explanation && (
                  <div className="pyq-solution-box">
                    <strong>Step-by-Step Solution:</strong>
                    <MathRenderer math={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
