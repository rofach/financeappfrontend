import { API_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Plus, Tags, Trash2, X, RefreshCw, Calendar, Play, Pause } from 'lucide-react';
import styles from './Recurring.module.css';

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  nameEn: string | null;
  nameUk: string | null;
  type: number;
}

interface RecurringPayment {
  id: string;
  account: Account;
  category: Category;
  type: number;
  amount: number;
  frequency: number;
  beginDate: string;
  nextExecuteDate: string | null;
  isActive: boolean;
}

interface RecurringProps {
  token: string;
  locale: 'en' | 'uk';
}

export const Recurring: React.FC<RecurringProps> = ({ token, locale }) => {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Form State
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState(2); // Expense by default
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState(3); // Monthly by default
  const [beginDate, setBeginDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchCategories();
    fetchAccounts();
  }, [token]);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/recurring-payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.data || []);
      } else {
        throw new Error('Failed to fetch recurring payments');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const cats = data.data || data;
        setCategories(cats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const accs = data.data || data;
        setAccounts(accs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/recurring-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId,
          categoryId,
          type: Number(type),
          amount: Number(amount),
          frequency: Number(frequency),
          beginDate
        })
      });
      if (!res.ok) throw new Error('Failed to create recurring payment');

      setShowModal(false);
      fetchPayments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`${API_URL}/api/v1/recurring-payments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      fetchPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this recurring payment?')) return;
    try {
      await fetch(`${API_URL}/api/v1/recurring-payments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const getFrequencyLabel = (freq: number) => {
    switch (freq) {
      case 1: return 'Daily';
      case 2: return 'Weekly';
      case 3: return 'Monthly';
      case 4: return 'Yearly';
      default: return 'Unknown';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Recurring Payments</h2>
          <p>Automate your regular income and expenses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Create Payment
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className={styles.grid}>
          {payments.map(payment => (
            <div key={payment.id} className={`${styles.card} ${!payment.isActive ? styles.inactive : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <div className={`${styles.typeIcon} ${payment.type === 1 ? styles.income : styles.expense}`}>
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <h4>{(locale === 'uk' && payment.category.nameUk) ? payment.category.nameUk : (payment.category.nameEn || 'Unnamed Category')}</h4>
                    <span>{payment.account.name}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button onClick={() => toggleActive(payment.id, payment.isActive)} className={styles.iconBtn} title={payment.isActive ? 'Pause' : 'Resume'}>
                    {payment.isActive ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={() => handleDelete(payment.id)} className={styles.iconBtnError}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.amountGroup}>
                  <span className={styles.label}>Amount</span>
                  <span className={`${styles.amount} ${payment.type === 1 ? styles.textIncome : styles.textExpense}`}>
                    {payment.type === 1 ? '+' : '-'}${payment.amount}
                  </span>
                </div>

                <div className={styles.detailsGroup}>
                  <div className={styles.detailItem}>
                    <Tags size={14} />
                    {getFrequencyLabel(payment.frequency)}
                  </div>
                  <div className={styles.detailItem}>
                    <Calendar size={14} />
                    Next: {payment.nextExecuteDate ? new Date(payment.nextExecuteDate).toLocaleDateString() : 'Pending'}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className={styles.empty}>
              <RefreshCw size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>No recurring payments set up yet.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn btn-text" style={{ position: 'absolute', right: '16px', top: '16px', padding: '4px' }} onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>
            
            <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>
              Create Recurring Payment
            </h3>
            
            <form onSubmit={handleCreate} className="modal-body">
              <div className="form-group">
                <label>Type</label>
                <select value={type} onChange={e => setType(Number(e.target.value))} required className="form-control" style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}>
                  <option value={2}>Expense</option>
                  <option value={1}>Income</option>
                </select>
              </div>
              <div className="form-group">
                <label>Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} required className="form-control" style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}>
                  <option value="">Select account...</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="form-control" style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}>
                  <option value="">Select category...</option>
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.id}>{(locale === 'uk' && c.nameUk) ? c.nameUk : (c.nameEn || 'Unnamed Category')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="form-control" />
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <select value={frequency} onChange={e => setFrequency(Number(e.target.value))} required className="form-control" style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}>
                  <option value={1}>Daily</option>
                  <option value={2}>Weekly</option>
                  <option value={3}>Monthly</option>
                  <option value={4}>Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={beginDate} onChange={e => setBeginDate(e.target.value)} required className="form-control" />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Create Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
