import { API_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import {
  LogOut, Plus, Wallet, ShieldAlert, Edit2, Trash2, Globe,
  TrendingUp, Landmark, X, DollarSign, Euro, Coins, AlertCircle, LayoutDashboard, Tags, ArrowRightLeft, Repeat
} from 'lucide-react';
import styles from './Dashboard.module.css';
import { Categories } from '../Categories';
import { Transactions } from '../Transactions';
import { Recurring } from '../Recurring';

interface DashboardProps {
  token: string;
  user: any;
  onLogout: () => void;
  onNavigateToAdmin: () => void;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  createdAt: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ token, user, onLogout, onNavigateToAdmin }) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'CATEGORIES' | 'TRANSACTIONS' | 'RECURRING'>('ACCOUNTS');
  const [locale, setLocale] = useState<'en' | 'uk'>('en');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals and Filter state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [viewingAccountId, setViewingAccountId] = useState<string | undefined>(undefined);

  // Forms state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState('0');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [apiRates, setApiRates] = useState<Record<string, number> | null>(null);

  // Load accounts
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/v1/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve financial accounts.');
      }

      const data = await response.json();
      setAccounts(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading your accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token]);

  // Create account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          currency,
          balance: parseFloat(balance) || 0.00,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create financial account.');
      }

      setShowCreateModal(false);
      setName('');
      setCurrency('USD');
      setBalance('0');
      fetchAccounts();
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during account creation.');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit account
  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    setActionError(null);
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/accounts/${selectedAccount.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          currency,
          balance: parseFloat(balance) || 0.00,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update financial account.');
      }

      setShowEditModal(false);
      setSelectedAccount(null);
      setName('');
      setCurrency('USD');
      setBalance('0');
      fetchAccounts();
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during account update.');
    } finally {
      setActionLoading(false);
    }
  };

  // Soft Delete account
  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;

    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/v1/accounts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account.');
      }

      fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'An error occurred during account deletion.');
    }
  };

  const openCreateModal = () => {
    setName('');
    setCurrency('USD');
    setBalance('0');
    setActionError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (account: Account) => {
    setSelectedAccount(account);
    setName(account.name);
    setCurrency(account.currency.code);
    setBalance(account.balance.toString());
    setActionError(null);
    setShowEditModal(true);
  };

  const userBaseCurrency = user?.baseCurrency?.code || 'USD';
  const userBaseCurrencySymbol = user?.baseCurrency?.symbol || '$';

  // Fetch exchange rates from NestJS Backend API
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/currencies/rates/${userBaseCurrency}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (response.ok && data) {
          setApiRates(data);
        } else {
          throw new Error('Failed to retrieve rates from backend service');
        }
      } catch (err) {
        console.error('Failed to load live rates from backend, using fallbacks', err);
      }
    };

    fetchExchangeRates();
  }, [userBaseCurrency, token]);

  // Dynamic currency rates with static fallbacks
  const getExchangeRate = (from: string, to: string) => {
    if (from === to) return 1;

    // Use dynamic backend-served API rates if loaded
    if (apiRates && apiRates[from]) {
      return 1 / apiRates[from];
    }

    // Hardcoded static fallback exchange rates
    const staticRates: Record<string, number> = {
      'USD_EUR': 0.92,
      'EUR_USD': 1.09,
      'USD_UAH': 40.0,
      'UAH_USD': 0.025,
      'EUR_UAH': 43.5,
      'UAH_EUR': 0.023,
    };
    return staticRates[`${from}_${to}`] || 1;
  };

  // Recalculate combined balance parsed into user base currency
  const totalNetWorth = accounts.reduce((acc, account) => {
    const rate = getExchangeRate(account.currency.code, userBaseCurrency);
    return acc + (account.balance * rate);
  }, 0);

  const getCurrencyIcon = (code: string) => {
    switch (code) {
      case 'USD': return <DollarSign size={20} />;
      case 'EUR': return <Euro size={20} />;
      default: return <Coins size={20} />;
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoSection}>
          <Landmark size={24} className={styles.logoIcon} />
          <span>FinanceApp</span>
        </div>

        <div className={styles.userSection}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '20px', padding: '4px', border: '1px solid var(--border)' }}>
            <button 
              onClick={() => setLocale('en')}
              style={{ padding: '2px 10px', fontSize: '12px', fontWeight: 600, background: locale === 'en' ? 'var(--accent)' : 'transparent', color: locale === 'en' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '16px', cursor: 'pointer' }}
            >
              EN
            </button>
            <button 
              onClick={() => setLocale('uk')}
              style={{ padding: '2px 10px', fontSize: '12px', fontWeight: 600, background: locale === 'uk' ? 'var(--accent)' : 'transparent', color: locale === 'uk' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '16px', cursor: 'pointer' }}
            >
              UK
            </button>
          </div>

          <div className={styles.userBadge}>
            <div className={styles.userAvatar}>
              {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
            </div>
            <span>{user?.firstName} {user?.lastName}</span>
            <span className={styles.currencyBadge}>{userBaseCurrency}</span>
          </div>

          {user.role?.id === 1 && (
            <button className="btn btn-primary" style={{ marginRight: '16px' }} onClick={onNavigateToAdmin}>
              <ShieldAlert size={16} />
              <span>Admin Panel</span>
            </button>
          )}

          <button className="btn btn-secondary" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className={styles.mainContent}>
        <div className={styles.viewTabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'ACCOUNTS' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('ACCOUNTS'); setViewingAccountId(undefined); }}
          >
            <LayoutDashboard size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Accounts Overview
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'CATEGORIES' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('CATEGORIES'); setViewingAccountId(undefined); }}
          >
            <Tags size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Categories
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'TRANSACTIONS' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('TRANSACTIONS'); setViewingAccountId(undefined); }}
          >
            <ArrowRightLeft size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Transactions
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'RECURRING' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('RECURRING'); setViewingAccountId(undefined); }}
          >
            <Repeat size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Recurring
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'CATEGORIES' ? (
          <Categories token={token} locale={locale} />
        ) : activeTab === 'TRANSACTIONS' ? (
          <Transactions token={token} locale={locale} accountId={viewingAccountId} />
        ) : activeTab === 'RECURRING' ? (
          <Recurring token={token} locale={locale} />
        ) : (
          <>
            {/* Top Summary Widgets */}
            <section className={styles.statsGrid}>
              <div className={`card ${styles.statCard}`}>
                <div className={styles.statIconWrapper} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className={styles.statLabel}>Net Worth ({userBaseCurrency})</p>
                  <h3 className={styles.statValue}>{userBaseCurrencySymbol}{totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>
              </div>

              <div className={`card ${styles.statCard}`}>
                <div className={styles.statIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }}>
                  <Wallet size={24} />
                </div>
                <div>
                  <p className={styles.statLabel}>Active Accounts</p>
                  <h3 className={styles.statValue}>{accounts.length}</h3>
                </div>
              </div>

              <div className={`card ${styles.statCard}`}>
                <div className={styles.statIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  <Globe size={24} />
                </div>
                <div>
                  <p className={styles.statLabel}>Profile Base Currency</p>
                  <h3 className={styles.statValue}>{user?.baseCurrency?.name || 'US Dollar'}</h3>
                </div>
              </div>
            </section>

            {/* Accounts Grid Title */}
            <div className={styles.accountsHeader}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Your Accounts</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  All actions are strictly isolated to your user profile.
                </p>
              </div>

              <button className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={16} />
                <span>Create Account</span>
              </button>
            </div>

            {/* Content Body */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '16px' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Loading financial accounts...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className={styles.emptyState}>
                <Wallet className={styles.emptyIcon} size={48} />
                <h3 className={styles.emptyTitle}>No accounts available</h3>
                <p className={styles.emptyDescription}>Create your first account to record balances and log transactions.</p>
                <button className="btn btn-primary" onClick={openCreateModal}>
                  <Plus size={16} />
                  <span>Create Account</span>
                </button>
              </div>
            ) : (
              <div className={styles.accountsGrid}>
                {accounts.map((account) => (
                  <div key={account.id} className={`card ${styles.accountCard} ${styles[account.currency.code] || ''}`}>
                    <div className={styles.accountMeta}>
                      <div>
                        <h3 className={styles.accountName}>{account.name}</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Created: {new Date(account.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={styles.currencyBadge}>{account.currency.code}</span>
                    </div>

                    <p className={styles.accountBalanceLabel}>Current Balance</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                        {getCurrencyIcon(account.currency.code)}
                      </span>
                      <h2 className={styles.accountBalance}>
                        {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h2>
                    </div>

                    <div className={styles.accountActions}>
                      <button className="btn btn-text" onClick={() => {
                        setViewingAccountId(account.id);
                        setActiveTab('TRANSACTIONS');
                      }}>
                        <LayoutDashboard size={14} />
                        <span>View Details</span>
                      </button>
                      <button className="btn btn-text" onClick={() => openEditModal(account)}>
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button className="btn btn-text" style={{ color: 'var(--accent-danger)' }} onClick={() => handleDeleteAccount(account.id)}>
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* CREATE ACCOUNT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn btn-text" style={{ position: 'absolute', right: '16px', top: '16px', padding: '4px' }} onClick={() => setShowCreateModal(false)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>New Financial Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Create an account with a specific starting balance.
            </p>

            {actionError && (
              <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '13px' }}>
                <ShieldAlert size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount}>
              <div className="form-group">
                <label className="form-label">Account Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Personal Savings, Cash Wallet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  className="form-control"
                  style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="UAH">UAH (₴) - Ukrainian Hryvnia</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Starting Balance</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <div className="spinner"></div> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCOUNT MODAL */}
      {showEditModal && selectedAccount && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn btn-text" style={{ position: 'absolute', right: '16px', top: '16px', padding: '4px' }} onClick={() => setShowEditModal(false)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>Edit Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Modify details of the selected financial account.
            </p>

            {actionError && (
              <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '13px' }}>
                <ShieldAlert size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleEditAccount}>
              <div className="form-group">
                <label className="form-label">Account Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Account Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  className="form-control"
                  style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="UAH">UAH (₴) - Ukrainian Hryvnia</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Balance</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedAccount(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <div className="spinner"></div> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
