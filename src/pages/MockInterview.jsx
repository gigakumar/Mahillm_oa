import { useState } from 'react';
import { Mic, Square, ChevronLeft, ChevronRight, Lightbulb, MessageSquare } from 'lucide-react';
import './MockInterview.css';

const QUESTIONS = {
  Technical: [
    { q: "Explain the difference between a two-stroke and a four-stroke engine.", tips: ["Compare power strokes per revolution", "Discuss efficiency and emissions", "Mention lubrication differences"] },
    { q: "What is the significance of the Mohr's Circle in stress analysis?", tips: ["Explain principal stresses", "Describe graphical representation", "Mention applications in design"] },
    { q: "Describe the working principle of a centrifugal pump.", tips: ["Explain impeller action", "Discuss conversion of kinetic to pressure energy", "Mention priming"] },
    { q: "What are the differences between a Carnot cycle and a Rankine cycle?", tips: ["Compare ideal vs practical", "Discuss working fluids", "Mention efficiency factors"] },
    { q: "Explain the concept of factor of safety in machine design.", tips: ["Define FoS mathematically", "Discuss why we use it", "Mention typical values for different materials"] },
    { q: "What is the difference between hot working and cold working of metals?", tips: ["Compare recrystallization temperature", "Discuss mechanical properties", "Mention surface finish differences"] },
    { q: "Describe the different types of fits used in engineering assemblies.", tips: ["Clearance, transition, interference", "Give practical examples", "Discuss tolerance grades"] },
    { q: "Explain the concept of entropy and its importance in thermodynamics.", tips: ["Define entropy mathematically", "Discuss reversible vs irreversible processes", "Relate to the second law"] },
    { q: "What are the different types of gears and their applications?", tips: ["Spur, helical, bevel, worm", "Discuss advantages of each", "Mention real-world applications"] },
    { q: "Explain the concept of boundary layer in fluid mechanics.", tips: ["Define boundary layer thickness", "Discuss laminar vs turbulent", "Mention practical significance"] },
    { q: "What is the difference between casting and forging? When would you choose one over the other?", tips: ["Compare manufacturing processes", "Discuss strength characteristics", "Mention cost and volume considerations"] },
    { q: "Explain the Bernoulli's equation and state its assumptions.", tips: ["State the equation", "List all assumptions", "Give a practical application"] },
    { q: "Describe the vapour compression refrigeration cycle.", tips: ["Name all four processes", "Draw the P-h diagram", "Mention components involved"] },
    { q: "What are the different types of welding processes? Compare MIG and TIG welding.", tips: ["Explain the working principles", "Compare shielding gas usage", "Discuss material suitability"] },
    { q: "Explain the concept of stress concentration and how to mitigate it.", tips: ["Define stress concentration factor", "Mention causes (notches, holes)", "Discuss design solutions (fillets, gradual transitions)"] },
  ],
  Behavioral: [
    { q: "Tell me about a time you worked under a tight deadline to complete a project.", tips: ["Use STAR method", "Quantify your results", "Show your time management skills"] },
    { q: "Describe a situation where you had to resolve a conflict within your team.", tips: ["Don't blame anyone", "Focus on communication", "Highlight the resolution and what you learned"] },
    { q: "What's your biggest weakness and how are you working on it?", tips: ["Be genuine, not cliché", "Show self-awareness", "Demonstrate growth mindset"] },
    { q: "Why do you want to work at our company specifically?", tips: ["Research the company beforehand", "Align with their values/products", "Be specific, avoid generic answers"] },
    { q: "Tell me about a project you're most proud of.", tips: ["Pick something relevant", "Explain your specific contribution", "Discuss the impact and results"] },
    { q: "How do you handle failure or setbacks?", tips: ["Give a real example", "Show resilience", "Focus on the learning, not the failure"] },
    { q: "Describe your approach to learning a new technology or tool.", tips: ["Mention specific resources", "Talk about hands-on practice", "Discuss a real learning experience"] },
    { q: "Where do you see yourself in 5 years?", tips: ["Align with the role/industry", "Show ambition but be realistic", "Mention skill growth, not just titles"] },
    { q: "Tell me about a time you took initiative beyond your assigned role.", tips: ["Pick a concrete example", "Show proactive thinking", "Quantify the positive impact"] },
    { q: "How do you prioritize when you have multiple tasks with the same deadline?", tips: ["Mention a framework (Eisenhower, etc.)", "Give a real example", "Discuss communication with stakeholders"] },
  ],
  HR: [
    { q: "Tell me about yourself.", tips: ["Keep it under 2 minutes", "Focus on relevant background", "End with why you're here"] },
    { q: "What are your salary expectations?", tips: ["Research market rates first", "Give a range, not a fixed number", "Mention flexibility based on role and benefits"] },
    { q: "Are you willing to relocate?", tips: ["Be honest", "Show flexibility if possible", "Ask about relocation support"] },
    { q: "Why should we hire you over other candidates?", tips: ["Highlight unique skills/experiences", "Reference the job description", "Be confident but not arrogant"] },
    { q: "Do you have any questions for us?", tips: ["Always say yes", "Ask about team culture or growth", "Avoid asking about leave/benefits first"] },
    { q: "What motivates you to do your best work?", tips: ["Be authentic", "Tie it to the role if possible", "Avoid purely monetary answers"] },
    { q: "How do you handle pressure and stressful situations?", tips: ["Give a real example", "Mention coping strategies", "Show that stress doesn't compromise quality"] },
    { q: "What do you know about our company?", tips: ["Research products, mission, recent news", "Mention specific projects that excite you", "Show genuine interest"] },
  ],
};

export default function MockInterview() {
  const [tab, setTab] = useState('Technical');
  const [idx, setIdx] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const list = QUESTIONS[tab];
  const item = list[idx];
  const tabs = Object.keys(QUESTIONS);

  const goTo = (i) => { setIdx(i); setShowTips(false); setIsRecording(false); };

  return (
    <div className="page-content mock-interview">
      <header className="mi-header">
        <div>
          <h1>Mock Interview 🎙️</h1>
          <p className="practice-subtitle">Practice answering out loud. Pretend it's the real deal.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="mi-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={`mi-tab ${tab === t ? 'active' : ''}`}
            onClick={() => { setTab(t); goTo(0); }}
          >
            {t === 'Technical' ? '⚙️' : t === 'Behavioral' ? '🧠' : '🤝'} {t}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <div className="mi-card card">
        <div className="mi-counter">
          Question {idx + 1} of {list.length}
        </div>
        <h2 className="mi-question">{item.q}</h2>

        {/* Tips toggle */}
        <button className="btn btn-ghost tips-toggle" onClick={() => setShowTips(!showTips)}>
          <Lightbulb size={16} />
          {showTips ? 'Hide Tips' : 'Show Tips'}
        </button>

        {showTips && (
          <div className="tips-box">
            <h4>💡 How to approach this:</h4>
            <ul>
              {item.tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
        )}

        {/* Recorder */}
        <div className="recorder">
          <div className={`recorder-status ${isRecording ? 'active' : ''}`}>
            <div className="rec-dot"></div>
            {isRecording ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>Recording… speak clearly</span>
                <div className="wave">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              </div>
            ) : 'Tap to start practicing'}
          </div>
          {!isRecording ? (
            <button className="rec-btn start" onClick={() => setIsRecording(true)}>
              <Mic size={22} /> Start
            </button>
          ) : (
            <button className="rec-btn stop" onClick={() => setIsRecording(false)}>
              <Square size={22} /> Stop
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="mi-nav">
          <button className="btn btn-ghost" onClick={() => goTo(Math.max(0, idx - 1))} disabled={idx === 0}>
            <ChevronLeft size={16} /> Previous
          </button>
          <button className="btn btn-primary" onClick={() => goTo(Math.min(list.length - 1, idx + 1))} disabled={idx === list.length - 1}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
