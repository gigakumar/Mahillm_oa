import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDoc,
  query,
  limit
} from 'firebase/firestore';
import { 
  ShieldAlert, 
  Check, 
  X, 
  FileText, 
  Flag, 
  AlertOctagon, 
  Trash2, 
  Filter, 
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(null); // null = checking, false = unauthorized, true = admin
  const [reports, setReports] = useState([]);
  const [quarantinedIds, setQuarantinedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadedQuestions, setLoadedQuestions] = useState({});
  const [loadingPools, setLoadingPools] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Verify admin privilege
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    async function checkAdmin() {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists() && snap.data().isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("Error validating admin role in dashboard:", e);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [user]);

  // 2. Load reports and quarantine list
  const fetchAdminData = async () => {
    if (isAdmin !== true) return;
    setLoading(true);
    try {
      // Fetch reported questions
      const reportsSnap = await getDocs(collection(db, 'reports'));
      const rList = [];
      reportsSnap.forEach(d => {
        rList.push({ id: d.id, ...d.data() });
      });
      setReports(rList);

      // Fetch quarantined list
      const qSnap = await getDocs(collection(db, 'quarantined_questions'));
      const qIds = new Set();
      qSnap.forEach(d => {
        qIds.add(d.id.toString());
      });
      setQuarantinedIds(qIds);
    } catch (e) {
      console.error("Error fetching admin dashboard registers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin === true) {
      fetchAdminData();
    }
  }, [isAdmin]);

  // 3. Dynamically load matching questions from JS data files for previewing
  useEffect(() => {
    if (reports.length === 0) return;

    async function loadRequiredPools() {
      setLoadingPools(true);
      const pools = { ...loadedQuestions };
      const representedCategories = new Set(reports.map(r => r.category).filter(Boolean));

      const categoryPromises = [];
      // If we don't have category metadata, load all by default
      const needsAll = representedCategories.size === 0;

      if ((representedCategories.has('Mechanical Engineering') || needsAll) && !pools['Mechanical Engineering']) {
        categoryPromises.push(fetch('/data/mechEngQuestions.json').then(r => r.json()).then(data => { pools['Mechanical Engineering'] = data; }));
      }
      if ((representedCategories.has('Quantitative Aptitude') || needsAll) && !pools['Quantitative Aptitude']) {
        categoryPromises.push(fetch('/data/quantsQuestions.json').then(r => r.json()).then(data => { pools['Quantitative Aptitude'] = data; }));
      }
      if ((representedCategories.has('Data Interpretation') || needsAll) && !pools['Data Interpretation']) {
        categoryPromises.push(fetch('/data/dataInterpretationQuestions.json').then(r => r.json()).then(data => { pools['Data Interpretation'] = data; }));
      }
      if ((representedCategories.has('DILR') || needsAll) && !pools['DILR']) {
        categoryPromises.push(fetch('/data/dilrQuestions.json').then(r => r.json()).then(data => { pools['DILR'] = data; }));
      }
      if ((representedCategories.has('Logical Reasoning') || needsAll) && !pools['Logical Reasoning']) {
        categoryPromises.push(fetch('/data/logicalReasoningQuestions.json').then(r => r.json()).then(data => { pools['Logical Reasoning'] = data; }));
      }

      try {
        await Promise.all(categoryPromises);
        const qMap = {};
        Object.keys(pools).forEach(cat => {
          pools[cat].forEach(q => {
            qMap[q.id.toString()] = q;
          });
        });
        setLoadedQuestions(qMap);
      } catch (e) {
        console.error("Error dynamically loading question pools for admin dashboard:", e);
      } finally {
        setLoadingPools(false);
      }
    }

    loadRequiredPools();
  }, [reports]);

  const handleQuarantine = async (qId) => {
    const qIdStr = qId.toString();
    try {
      const docRef = doc(db, 'quarantined_questions', qIdStr);
      await setDoc(docRef, {
        quarantined: true,
        quarantinedAt: new Date().toISOString(),
        reportedByAdmin: user.email
      });
      setQuarantinedIds(prev => {
        const updated = new Set(prev);
        updated.add(qIdStr);
        return updated;
      });
    } catch (e) {
      console.error("Error quarantining question:", e);
    }
  };

  const handleRemoveQuarantine = async (qId) => {
    const qIdStr = qId.toString();
    try {
      await deleteDoc(doc(db, 'quarantined_questions', qIdStr));
      setQuarantinedIds(prev => {
        const updated = new Set(prev);
        updated.delete(qIdStr);
        return updated;
      });
    } catch (e) {
      console.error("Error removing question quarantine:", e);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (e) {
      console.error("Error dismissing reported question:", e);
    }
  };

  if (loading) {
    return (
      <div className="page-content admin-page">
        <div className="loading" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p>Verifying credentials & loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="page-content admin-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card text-center" style={{ maxWidth: '400px', padding: '2rem' }}>
          <ShieldAlert size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
          <h2>Unauthorized Access</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You must be logged in with administrator privileges to view this page.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  // Filter reports
  const filteredReports = reports.filter(r => {
    if (!searchQuery) return true;
    const qIdStr = r.questionId?.toString() || '';
    const details = r.details?.toLowerCase() || '';
    const qText = r.questionText?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return qIdStr.includes(query) || details.includes(query) || qText.includes(query);
  });

  return (
    <div className="page-content admin-page">
      <h1>Admin Quality Dashboard 🛡️</h1>
      <p className="practice-subtitle" style={{ marginBottom: '2rem' }}>
        Monitor, quarantine, and audit the 25,062 question database based on user flag reports.
      </p>

      {/* Grid Stats */}
      <div className="admin-grid-top">
        <div className="card admin-stat-card">
          <span className="mistake-stat-label">Total Questions</span>
          <span className="heatmap-score-text">25,062</span>
          <span className="badge badge-secondary-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}>
            Core database size
          </span>
        </div>
        <div className="card admin-stat-card">
          <span className="mistake-stat-label">Reported Questions</span>
          <span className="heatmap-score-text" style={{ color: 'var(--warning)' }}>{reports.length}</span>
          <span className="badge badge-warning-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}>
            Awaiting action
          </span>
        </div>
        <div className="card admin-stat-card">
          <span className="mistake-stat-label">Quarantined</span>
          <span className="heatmap-score-text" style={{ color: 'var(--danger)' }}>{quarantinedIds.size}</span>
          <span className="badge badge-danger-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}>
            Excluded from selection
          </span>
        </div>
      </div>

      {/* Filters and actions bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', margin: 0, height: '38px' }}
            placeholder="Search reports by ID, report details, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-secondary"
          style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={fetchAdminData}
        >
          <RefreshCw size={16} /> Sync Logs
        </button>
      </div>

      {/* Reports Table list */}
      {loadingPools ? (
        <div className="loading" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p>Mapping report ids to question models...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <Check size={48} style={{ color: 'var(--success)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No reports found!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>All questions are currently clean. No flagging records found in database.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Q ID</th>
                <th>Subject / Topic</th>
                <th>Issue Reason</th>
                <th>Details / Flag Description</th>
                <th>Origin / Cluster</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => {
                const qIdStr = r.questionId?.toString();
                const qObj = loadedQuestions[qIdStr];
                const isQuarantined = quarantinedIds.has(qIdStr);

                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 'bold' }}>{r.questionId}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.category}</span>
                        <span style={{ fontWeight: 600 }}>{qObj?.topic || 'Unresolved Topic'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-warning" style={{ fontSize: '0.75rem', background: 'rgba(234,179,8,0.15)', color: 'var(--warning)' }}>
                        {r.issueType}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontStyle: 'italic' }}>"{r.details || 'No details provided'}"</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reported by: {r.reportedBy}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.8rem' }}>Origin: {qObj?.originType || 'Legacy'}</span>
                        {qObj?.templateClusterId && (
                          <span className="cluster-bubble" title="Template cluster ID for template deduplication">
                            {qObj.templateClusterId.slice(0, 12)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${isQuarantined ? 'quarantined' : 'flagged'}`}>
                        {isQuarantined ? 'Quarantined' : 'Flagged'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-btn-row">
                        {!isQuarantined ? (
                          <button 
                            className="admin-action-btn quarantine"
                            onClick={() => handleQuarantine(r.questionId)}
                            title="Exclude this question from all selection lists"
                          >
                            Quarantine
                          </button>
                        ) : (
                          <button
                            className="admin-action-btn approve"
                            onClick={() => handleRemoveQuarantine(r.questionId)}
                            title="Approve and lift quarantine"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          className="admin-action-btn"
                          style={{ borderColor: 'var(--border)' }}
                          onClick={() => handleDismissReport(r.id)}
                          title="Dismiss this report log"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Checklist panel */}
      <div className="card" style={{ padding: '1.5rem', marginTop: '2.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', margin: '0 0 0.5rem 0' }}>Quality Audit Protocol checklist</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          When reviewing flagged items:
          <br />
          1. <strong>Formatting errors:</strong> If LaTeX notation fails or HTML code leaks in text, quarantine the question immediately.
          <br />
          2. <strong>Incorrect keys:</strong> Verify correct answers using standard reference manuals (for SOM, Thermodynamics, FM).
          <br />
          3. <strong>Cluster concentrations:</strong> Check if a template cluster generates excessive duplicates and flag parent template.
        </p>
      </div>
    </div>
  );
}
