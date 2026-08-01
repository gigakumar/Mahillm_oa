import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, BookOpen, Layers, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';
import MathRenderer from './MathRenderer';
import './ConceptKnowledgeGraph.css';

const KNOWLEDGE_NODES = [
  {
    id: 'thermo_laws',
    title: 'Laws of Thermodynamics',
    subject: 'Thermodynamics',
    mastery: '85%',
    status: 'mastered',
    x: 180,
    y: 120,
    connections: ['heat_transfer', 'power_cycles'],
    keyFormula: 'dQ = dU + dW',
    summary: 'Governs heat-work equivalence (1st Law) and directional entropy generation (2nd Law).',
    trap: 'Watch sign conventions: Heat in (+), Work by (+).'
  },
  {
    id: 'power_cycles',
    title: 'Gas & Vapour Power Cycles',
    subject: 'Thermodynamics',
    mastery: '72%',
    status: 'in_progress',
    x: 140,
    y: 300,
    connections: ['thermo_laws', 'fluid_flow'],
    keyFormula: '\\eta_{otto} = 1 - \\frac{1}{r^{\\gamma - 1}}',
    summary: 'Otto, Diesel, Dual, Brayton, and Rankine thermodynamic cycles.',
    trap: 'Always use absolute temperature in Kelvin.'
  },
  {
    id: 'fluid_flow',
    title: 'Viscous Pipe Flow & Losses',
    subject: 'Fluid Mechanics',
    mastery: '68%',
    status: 'in_progress',
    x: 380,
    y: 280,
    connections: ['power_cycles', 'heat_transfer'],
    keyFormula: 'h_f = \\frac{f L v^2}{2 g D}',
    summary: 'Laminar and turbulent pipe flow, friction factor, Darcy head loss equation.',
    trap: 'Darcy friction factor f = 4 * Fanning friction factor f\'.'
  },
  {
    id: 'heat_transfer',
    title: 'Conduction & Convection',
    subject: 'Heat Transfer',
    mastery: '90%',
    status: 'mastered',
    x: 420,
    y: 100,
    connections: ['thermo_laws', 'fluid_flow', 'som_stress'],
    keyFormula: 'q = -k A \\frac{dT}{dx}',
    summary: 'Fourier 1D conduction, Newton cooling convection, and thermal resistance networks.',
    trap: 'Heat flux vector points down the negative temperature gradient.'
  },
  {
    id: 'som_stress',
    title: 'Stress-Strain & Mohr Circle',
    subject: 'Strength of Materials',
    mastery: '78%',
    status: 'mastered',
    x: 650,
    y: 140,
    connections: ['heat_transfer', 'machine_design'],
    keyFormula: '\\sigma_1, \\sigma_2 = \\frac{\\sigma_x + \\sigma_y}{2} \\pm \\sqrt{\\left(\\frac{\\sigma_x - \\sigma_y}{2}\\right)^2 + \\tau_{xy}^2}',
    summary: 'Principal stresses, maximum shear stress, and 2D Mohr stress transformation circle.',
    trap: 'Shear stress peak radius equals Mohr circle radius R.'
  },
  {
    id: 'machine_design',
    title: 'Fluctuating Fatigue Loads',
    subject: 'Machine Design',
    mastery: '54%',
    status: 'review_needed',
    x: 680,
    y: 320,
    connections: ['som_stress'],
    keyFormula: '\\frac{\\sigma_a}{S_e} + \\frac{\\sigma_m}{S_{ut}} = 1',
    summary: 'Soderberg, Goodman, and Gerber criteria for endurance limit and fatigue failure.',
    trap: 'Soderberg line uses Yield Strength S_yt; Goodman uses Tensile S_ut.'
  }
];

export default function ConceptKnowledgeGraph() {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(KNOWLEDGE_NODES[0]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handlePracticeNode = (topicName) => {
    navigate(`/oa-practice?cat=Mechanical%20Engineering&topic=${encodeURIComponent(topicName)}`);
  };

  return (
    <div className="concept-graph-card card">
      <div className="cg-header">
        <div>
          <div className="cg-badge">
            <Brain size={14} className="text-amber-400" />
            <span>Interactive Concept Graph</span>
          </div>
          <h2>Mechanical Engineering Knowledge Topology</h2>
          <p>Explore inter-subject dependencies, mastery status, and governing equations across core topics.</p>
        </div>
      </div>

      <div className="cg-layout">
        {/* Interactive Graph Canvas */}
        <div className="cg-canvas-container">
          <svg className="cg-svg-canvas" viewBox="0 0 850 420">
            {/* SVG Connecting Lines */}
            {KNOWLEDGE_NODES.map(node =>
              node.connections.map(targetId => {
                const target = KNOWLEDGE_NODES.find(n => n.id === targetId);
                if (!target) return null;
                const isSelected = selectedNode?.id === node.id || selectedNode?.id === target.id;
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    className={`cg-link-line ${isSelected ? 'active' : ''}`}
                  />
                );
              })
            )}

            {/* Interactive Nodes */}
            {KNOWLEDGE_NODES.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const statusColor = node.status === 'mastered' ? '#10b981' : node.status === 'in_progress' ? '#38bdf8' : '#f59e0b';
              return (
                <g
                  key={node.id}
                  className={`cg-node-group ${isSelected ? 'selected' : ''}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => handleNodeClick(node)}
                >
                  <circle r="28" fill="rgba(15, 23, 42, 0.9)" stroke={statusColor} strokeWidth={isSelected ? '3' : '2'} className="cg-node-circle" />
                  <circle r="8" fill={statusColor} />
                  <text y="44" className="cg-node-label">{node.title}</text>
                  <text y="58" className="cg-node-sub">{node.mastery} Mastery</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Panel */}
        {selectedNode && (
          <div className="cg-node-panel card">
            <div className="np-header">
              <span className="np-subject">{selectedNode.subject}</span>
              <span className={`np-status-tag ${selectedNode.status}`}>
                {selectedNode.status === 'mastered' ? '✅ Mastered' : selectedNode.status === 'in_progress' ? '⚡ In Progress' : '⚠️ Needs Review'}
              </span>
            </div>

            <h3 className="np-title">{selectedNode.title}</h3>
            <p className="np-summary">{selectedNode.summary}</p>

            <div className="np-formula-box">
              <span className="np-formula-label">Governing Formula:</span>
              <MathRenderer math={selectedNode.keyFormula} />
            </div>

            {selectedNode.trap && (
              <div className="np-trap-box">
                <AlertTriangle size={14} className="text-amber-400" />
                <span><strong>Exam Trap:</strong> {selectedNode.trap}</span>
              </div>
            )}

            <button className="btn btn-primary np-practice-btn" onClick={() => handlePracticeNode(selectedNode.subject)}>
              <Zap size={14} /> Practice {selectedNode.subject} Questions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
