import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('Mechanical Engineering');
  const [college, setCollege] = useState('Birla Institute of Technology, Mesra');
  const [graduationYear, setGraduationYear] = useState('2027');
  const [targetRole, setTargetRole] = useState('Graduate Engineer Trainee');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserSettings = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || user.displayName || '');
          setBranch(data.branch || 'Mechanical Engineering');
          setCollege(data.college || 'Birla Institute of Technology, Mesra');
          setGraduationYear(data.graduationYear || '2027');
          setTargetRole(data.targetRole || 'Graduate Engineer Trainee');
        } else {
          const localData = localStorage.getItem(`user_profile_${user.uid}`);
          if (localData) {
            const data = JSON.parse(localData);
            setName(data.name || user.displayName || '');
            setBranch(data.branch || 'Mechanical Engineering');
            setCollege(data.college || 'Birla Institute of Technology, Mesra');
            setGraduationYear(data.graduationYear || '2027');
            setTargetRole(data.targetRole || 'Graduate Engineer Trainee');
          } else {
            setName(user.displayName || '');
          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');
    
    const payload = {
      name,
      branch,
      college,
      graduationYear,
      targetRole,
      updatedAt: new Date().toISOString()
    };

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, payload, { merge: true });

      setMessage('Profile settings saved successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (err) {
      console.warn("Firestore save failed, falling back to local storage:", err);
      // Fallback for guests or permission denied
      localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(payload));
      setMessage('Profile settings saved locally!');
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page loading-state">
        <p>Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <main className="settings-shell">
        <button className="settings-back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={16} /> Back to Profile
        </button>

        <div className="card settings-card">
          <div className="settings-header">
            <h2>Edit Preparation Profile</h2>
            <p>Customize your academic details and goals to optimize your MechPrep recommendation engine.</p>
          </div>

          {message && (
            <div className={`settings-alert ${message.includes('successfully') ? 'success' : 'error'}`}>
              <ShieldCheck size={18} />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="branch">Engineering Branch</label>
              <input
                type="text"
                id="branch"
                className="form-input"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="college">College / University</label>
              <input
                type="text"
                id="college"
                className="form-input"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gradYear">Graduation Year</label>
                <input
                  type="text"
                  id="gradYear"
                  className="form-input"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetRole">Target Role</label>
                <input
                  type="text"
                  id="targetRole"
                  className="form-input"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary settings-save-btn" disabled={saving}>
              <Save size={18} />
              {saving ? 'Saving changes...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
