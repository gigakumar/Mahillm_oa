import React, { useState, useRef } from 'react';
import { FileText, Download, Printer, Sparkles, Check, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PremiumGate from '../components/PremiumGate';
import './PDFPracticeGenerator.css';

const SAMPLE_PDF_QUESTIONS = [
  {
    id: 1,
    q: "A Carnot engine operating between 800 K and 300 K produces 50 kW of work output. Heat rejected per second is:",
    opts: ["A) 30 kW", "B) 40 kW", "C) 50 kW", "D) 60 kW"],
    ans: "A"
  },
  {
    id: 2,
    q: "For a thin cylindrical shell of diameter d and wall thickness t subjected to internal pressure P, maximum shear stress is:",
    opts: ["A) Pd / 2t", "B) Pd / 4t", "C) Pd / 8t", "D) Pd / 16t"],
    ans: "C"
  },
  {
    id: 3,
    q: "The critical velocity of flow in a pipe occurs when the Reynolds number (Re) is approximately:",
    opts: ["A) 1000", "B) 2000", "C) 4000", "D) 10000"],
    ans: "B"
  }
];

export default function PDFPracticeGenerator() {
  const [topic, setTopic] = useState('Thermodynamics');
  const [numQuestions, setNumQuestions] = useState(10);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const pdfRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setDownloading(true);

    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MahiLLM_${topic.replace(/\s+/g, '_')}_Practice_Set.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page-content pdf-generator-page">
      <header className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' }}>
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>
              Smart PDF & LaTeX Practice Exporter 📄
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
              Generate custom printable exam papers, formula cheat-sheets, and mistake review notebooks.
            </p>
          </div>
        </div>
      </header>

      <PremiumGate 
        featureId="pdf_generator" 
        requiredTier="pro"
        title="Unlock Smart PDF Practice & Formula Exporter"
        subtitle="Export unlimited custom mock tests, formula flashcards, and solution keys formatted for printing."
      >
        <div className="pdf-controls-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
            Paper Configuration Settings
          </h3>

          <div className="pdf-options-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>Subject Stream</label>
              <select className="solver-input" value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="Thermodynamics">Thermodynamics & IC Engines</option>
                <option value="SOM">Strength of Materials (SOM)</option>
                <option value="Fluid Mechanics">Fluid Mechanics & Turbo Machines</option>
                <option value="General Aptitude">General Aptitude & Quants</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>Question Quantity</label>
              <select className="solver-input" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
                <option value={10}>10 Questions (Quick Review)</option>
                <option value={25}>25 Questions (Sectional Test)</option>
                <option value={65}>65 Questions (Full GATE Mock)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>Answer Key</label>
              <select className="solver-input" value={includeAnswers ? "yes" : "no"} onChange={(e) => setIncludeAnswers(e.target.value === "yes")}>
                <option value="yes">Include Answer Key & Explanations</option>
                <option value="no">Questions Only (Exam Mode)</option>
              </select>
            </div>
          </div>

          <button className="btn-solve" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
            {downloading ? 'Rendering HD Printable PDF...' : 'Download HD Printable PDF'}
          </button>
        </div>

        {/* Live Document Preview */}
        <div ref={pdfRef} className="pdf-preview-box">
          <div className="pdf-preview-header">
            <div>
              <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#0f172a' }}>MAHILLM OA - GATE MECHANICAL PRACTICE SHEET</h2>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>
                Subject: {topic} | Marks: {numQuestions * 2} | Time: {numQuestions * 2} Mins
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>AIR-1 Target Practice</div>
            </div>
          </div>

          <div>
            {SAMPLE_PDF_QUESTIONS.map((q) => (
              <div key={q.id} className="pdf-question-item">
                <div className="pdf-q-title">Q{q.id}. {q.q}</div>
                <div className="pdf-options-list">
                  {q.opts.map((o, idx) => (
                    <div key={idx}>{o}</div>
                  ))}
                </div>
                {includeAnswers && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#16a34a', fontWeight: 'bold' }}>
                    Correct Answer: {q.ans}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
            Generated by MahiLLM AIR-1 GATE Mastery Suite | www.mahillm.com
          </div>
        </div>
      </PremiumGate>
    </div>
  );
}
