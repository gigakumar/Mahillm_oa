import { Brain, Target, Activity, Search, Star } from 'lucide-react';
import './IntelligenceDrawer.css';

export default function IntelligenceDrawer({ question }) {
  // Mock intelligence data for now if missing
  const difficulty = question.intelligence?.difficulty ?? 0.82;
  const quality = question.intelligence?.quality ?? "Verified";
  const targetGap = question.intelligence?.targetGap ?? question.topic;

  return (
    <div className="intelligence-drawer">
      <div className="intelligence-drawer-header">
        <div className="drawer-title">
          <Brain size={18} />
          <span>WHY THIS QUESTION?</span>
        </div>
        <div className="drawer-badges">
          <span className="intel-badge">
            <Activity size={14} /> Difficulty: {difficulty}
          </span>
          <span className="intel-badge quality-verified">
            <Star size={14} /> Quality: {quality}
          </span>
        </div>
      </div>
      
      <div className="intelligence-drawer-body">
        <ul className="intel-list">
          <li>
            <Target size={16} className="intel-icon" />
            <span>Targets your gap in <strong>"{targetGap}"</strong></span>
          </li>
          <li>
            <Search size={16} className="intel-icon" />
            <span>High discrimination index (separates top 10%)</span>
          </li>
          {(!question.isCorrect && question.isAttempted) && (
            <li>
              <Brain size={16} className="intel-icon" />
              <span>You previously struggled with similar concepts in this area</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
