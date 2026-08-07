import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ScoreProvider } from './contexts/ScoreContext';
import { UserDataProvider } from './contexts/UserDataContext';
import ErrorBoundary from './components/ErrorBoundary';

import Layout from './components/Layout';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const OAPractice = React.lazy(() => import('./pages/OAPractice'));
const MockInterview = React.lazy(() => import('./pages/MockInterview'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Tests = React.lazy(() => import('./pages/Tests'));

const TestSession = React.lazy(() => import('./pages/TestSession'));
const TestResult = React.lazy(() => import('./pages/TestResult'));
const Mistakes = React.lazy(() => import('./pages/Mistakes'));
const RevisionSession = React.lazy(() => import('./pages/RevisionSession'));

const ReadinessHeatmap = React.lazy(() => import('./pages/ReadinessHeatmap'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const DailyChallenge = React.lazy(() => import('./pages/DailyChallenge'));

const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Stats = React.lazy(() => import('./pages/Stats'));
const StudyPlanner = React.lazy(() => import('./pages/StudyPlanner'));
const GatePredictor = React.lazy(() => import('./pages/GatePredictor'));
const PeerDuel = React.lazy(() => import('./pages/PeerDuel'));

const Formulas = React.lazy(() => import('./pages/Formulas'));
const Syllabus = React.lazy(() => import('./pages/Syllabus'));
const CollegePredictor = React.lazy(() => import('./pages/CollegePredictor'));
const Bookmarks = React.lazy(() => import('./pages/Bookmarks'));
const ExamStrategy = React.lazy(() => import('./pages/ExamStrategy'));

const Intelligence = React.lazy(() => import('./pages/Intelligence'));
const Timeline = React.lazy(() => import('./pages/Timeline'));

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
              <Suspense fallback={<div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
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

                <Route path="/tests" element={
                  <ProtectedRoute>
                    <Layout>
                      <Tests />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/test/:testId" element={
                  <ProtectedRoute>
                    <Layout>
                      <TestSession />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/test-result/:attemptId" element={
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

                <Route path="/revision" element={
                  <ProtectedRoute>
                    <Layout>
                      <RevisionSession />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/formulas" element={
                  <ProtectedRoute>
                    <Layout>
                      <Formulas />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/syllabus" element={
                  <ProtectedRoute>
                    <Layout>
                      <Syllabus />
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
                
                <Route path="/readiness" element={
                  <ProtectedRoute>
                    <Layout>
                      <ReadinessHeatmap />
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

                <Route path="/daily-challenge" element={
                  <ProtectedRoute>
                    <Layout>
                      <DailyChallenge />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/peer-duel" element={
                  <ProtectedRoute>
                    <Layout>
                      <PeerDuel />
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
              </Suspense>
            </Router>
          </UserDataProvider>
        </ScoreProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
