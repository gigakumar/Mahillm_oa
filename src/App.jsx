import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ScoreProvider } from './contexts/ScoreContext';
import { UserDataProvider } from './contexts/UserDataContext';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OAPractice from './pages/OAPractice';
import MockInterview from './pages/MockInterview';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Tests from './pages/Tests';
import SessionBriefing from './pages/tests/SessionBriefing';
import TestSession from './pages/TestSession';
import TestResult from './pages/TestResult';
import Mistakes from './pages/Mistakes';

import Intelligence from './pages/Intelligence';
import ReadinessHeatmap from './pages/ReadinessHeatmap';
import AttemptReplay from './pages/AttemptReplay';
import Timeline from './pages/Timeline';
import HowAIThinks from './pages/HowAIThinks';
import AdminDashboard from './pages/AdminDashboard';
import DailyChallenge from './pages/DailyChallenge';

import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import StudyPlanner from './pages/StudyPlanner';
import GatePredictor from './pages/GatePredictor';
import PeerDuel from './pages/PeerDuel';
import ComponentInspector from './pages/ComponentInspector';


import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
        <ScoreProvider>
          <UserDataProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/oa-practice" element={
                  <ProtectedRoute>
                    <Layout>
                      <OAPractice />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/mock-interview" element={
                  <ProtectedRoute>
                    <Layout>
                      <MockInterview />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/leaderboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <Leaderboard />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/stats" element={
                  <ProtectedRoute>
                    <Layout>
                      <Stats />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/tests" element={
                  <ProtectedRoute>
                    <Layout>
                      <Tests />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/tests/session-briefing" element={
                  <ProtectedRoute>
                    <Layout>
                      <SessionBriefing />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/tests/session" element={
                  <ProtectedRoute>
                    <TestSession />
                  </ProtectedRoute>
                } />

                <Route path="/tests/result/:testId" element={
                  <ProtectedRoute>
                    <Layout>
                      <TestResult />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/mistakes" element={
                  <ProtectedRoute>
                    <Layout>
                      <Mistakes />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/planner" element={
                  <ProtectedRoute>
                    <Layout>
                      <StudyPlanner />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/gate-predictor" element={
                  <ProtectedRoute>
                    <Layout>
                      <GatePredictor />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/duel" element={
                  <ProtectedRoute>
                    <Layout>
                      <PeerDuel />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/inspector" element={
                  <ProtectedRoute>
                    <Layout>
                      <ComponentInspector />
                    </Layout>
                  </ProtectedRoute>
                } />



                <Route path="/readiness" element={
                  <ProtectedRoute>
                    <Layout>
                      <ReadinessHeatmap />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/intelligence" element={
                  <ProtectedRoute>
                    <Layout>
                      <Intelligence />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/timeline" element={
                  <ProtectedRoute>
                    <Layout>
                      <Timeline />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/how-ai-thinks" element={
                  <ProtectedRoute>
                    <Layout>
                      <HowAIThinks />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/attempt-replay" element={
                  <ProtectedRoute>
                    <Layout>
                      <AttemptReplay />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/questions" element={
                  <ProtectedRoute>
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/daily-challenge" element={
                  <ProtectedRoute>
                    <Layout>
                      <DailyChallenge />
                    </Layout>
                  </ProtectedRoute>
                } />



                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </UserDataProvider>
        </ScoreProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
