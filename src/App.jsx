import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ScoreProvider } from './contexts/ScoreContext';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OAPractice from './pages/OAPractice';
import MockInterview from './pages/MockInterview';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Signup from './pages/Signup';

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
          </Routes>
        </Router>
        </ScoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
