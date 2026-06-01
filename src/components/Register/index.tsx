import { API_URL } from '../../config';
import React, { useState } from 'react';
import { UserPlus, Mail, Key, User, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import styles from './Register.module.css';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/email/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          baseCurrency,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed. Please check input values.');
      }

      setSuccess(true);
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Connection to database registration service failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={`card ${styles.authCard}`}>
        <div className={styles.logoContainer}>
          <div className={styles.logoBg}>
            <UserPlus size={28} style={{ color: 'var(--accent-success)' }} />
          </div>
        </div>

        <h2 className={styles.authTitle}>Create Account</h2>
        <p className={styles.authSubtitle}>Join us to organize and manage your wealth</p>

        {error && (
          <div className="alert alert-danger">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>Success! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <div style={{ position: 'relative' }}>
                <span className={styles.inputIcon}>
                  <User size={15} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '34px' }}
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <div style={{ position: 'relative' }}>
                <span className={styles.inputIcon}>
                  <User size={15} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '34px' }}
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span className={styles.inputIcon}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password (Min 6 characters)</label>
            <div style={{ position: 'relative' }}>
              <span className={styles.inputIcon}>
                <Key size={16} />
              </span>
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Base Currency</label>
            <div style={{ position: 'relative' }}>
              <span className={styles.inputIcon}>
                <Globe size={16} />
              </span>
              <select
                className="form-control"
                style={{ paddingLeft: '38px', appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                required
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="UAH">UAH (₴) - Ukrainian Hryvnia</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading || success}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <div className={styles.authFooter}>
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>
            Log in here
          </a>
        </div>
      </div>
    </div>
  );
};
