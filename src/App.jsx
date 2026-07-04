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
import TestSession from './pages/TestSession';
import TestResult from './pages/TestResult';
import Mistakes from './pages/Mistakes';
import RevisionSession from './pages/RevisionSession';
import ReadinessHeatmap from './pages/ReadinessHeatmap';
import AdminDashboard from './pages/AdminDashboard';
import DailyChallenge from './pages/DailyChallenge';
import Formulas from './pages/Formulas';


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

                <Route path="/tests" element={
                  <ProtectedRoute>
                    <Layout>
                      <Tests />
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

                <Route path="/revision" element={
                  <ProtectedRoute>
                    <Layout>
                      <RevisionSession />
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

                <Route path="/formulas" element={
                  <ProtectedRoute>
                    <Layout>
                      <Formulas />
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
  );
}

export default App;
