import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';

type ScreenState = 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'ADMIN';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('LOGIN');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load session from local storage on bootstrap
  useEffect(() => {
    const savedToken = localStorage.getItem('finance_app_token');
    const savedUser = localStorage.getItem('finance_app_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setScreen('DASHBOARD');
      } catch {
        localStorage.removeItem('finance_app_token');
        localStorage.removeItem('finance_app_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (loginToken: string, userData: any) => {
    localStorage.setItem('finance_app_token', loginToken);
    localStorage.setItem('finance_app_user', JSON.stringify(userData));
    setToken(loginToken);
    setUser(userData);
    setScreen('DASHBOARD');
  };

  const handleLogout = () => {
    localStorage.removeItem('finance_app_token');
    localStorage.removeItem('finance_app_user');
    setToken(null);
    setUser(null);
    setScreen('LOGIN');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0b0f19',
        color: '#ffffff'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '16px' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Verifying secure session...</p>
      </div>
    );
  }

  return (
    <>
      {screen === 'LOGIN' && (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onNavigateToRegister={() => setScreen('REGISTER')} 
        />
      )}
      {screen === 'REGISTER' && (
        <Register 
          onRegisterSuccess={() => setScreen('LOGIN')} 
          onNavigateToLogin={() => setScreen('LOGIN')} 
        />
      )}
      {screen === 'DASHBOARD' && token && user && (
        <Dashboard 
          token={token} 
          user={user} 
          onLogout={handleLogout} 
          onNavigateToAdmin={() => setScreen('ADMIN')}
        />
      )}
      {screen === 'ADMIN' && token && user?.role?.id === 1 && (
        <AdminPanel 
          token={token} 
          onBackToDashboard={() => setScreen('DASHBOARD')}
        />
      )}
    </>
  );
};

export default App;
