import { API_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, X, AlertCircle } from 'lucide-react';
import styles from './Transactions.module.css';

interface TransactionsProps {
  token: string;
  locale: 'en' | 'uk';
  accountId?: string; // Optional: if provided, filters/defaults to this account
}

interface Transaction {
  id: string;
  type: number; // 1 for Income, 2 for Expense
  amount: number;
  baseAmount: number;
  date: string;
  note: string | null;
  account: {
    id: string;
    name: string;
    currency: {
      code: string;
    };
  };
  category: {
    id: string;
    nameEn: string;
    nameUk: string;
  };
}

interface Account {
  id: string;
  name: string;
  currency: {
    code: string;
  };
}

interface Category {
  id: string;
  nameEn: string;
  nameUk: string;
}

export const Transactions: React.FC<TransactionsProps> = ({ token, locale, accountId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [type, setType] = useState<number>(2); // 2 = Expense, 1 = Income
  const [amount, setAmount] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const txUrl = accountId 
        ? `${API_URL}/api/v1/transactions?limit=50&accountId=${accountId}`
        : `${API_URL}/api/v1/transactions?limit=50`;

      const [txRes, accRes, catRes] = await Promise.all([
        fetch(txUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/v1/accounts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/v1/categories?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!txRes.ok || !accRes.ok || !catRes.ok) {
        throw new Error('Failed to load transaction data.');
      }

      let txData = await txRes.json();
      const accData = await accRes.json();
      const catData = await catRes.json();

      if (txData.data) {
        txData = txData.data;
      }

      setTransactions(txData);
      setAccounts(accData);
      
      const cats = catData.data || catData;
      setCategories(cats);

      if (accData.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accData[0].id);
      }
      if (cats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(cats[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, accountId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          date,
          note: note || undefined,
          accountId: selectedAccountId,
          categoryId: selectedCategoryId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create transaction');

      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    setActionError(null);
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/transactions/${selectedTransaction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          date,
          note: note || undefined,
          accountId: selectedAccountId,
          categoryId: selectedCategoryId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update transaction');

      setShowEditModal(false);
      setSelectedTransaction(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete transaction');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setType(2);
    setAmount('0');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    if (accounts.length > 0) setSelectedAccountId(accountId || accounts[0].id);
    if (categories.length > 0) setSelectedCategoryId(categories[0].id);
  };

  const openCreateModal = () => {
    resetForm();
    setActionError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setType(tx.type);
    setAmount(tx.amount.toString());
    setDate(new Date(tx.date).toISOString().split('T')[0]);
    setNote(tx.note || '');
    setSelectedAccountId(tx.account.id);
    setSelectedCategoryId(tx.category.id);
    setActionError(null);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '16px' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Transactions</h2>
          <p className={styles.subtitle}>
            Manage your incomes and expenses. Balances will recalculate automatically.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          <span>Add Transaction</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="alert" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'center', padding: '40px' }}>
          <h3 style={{ marginBottom: '8px' }}>No transactions found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>You haven't recorded any transactions yet.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Note</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.typeBadge} ${tx.type === 1 ? styles.income : styles.expense}`}>
                      {tx.type === 1 ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td>{locale === 'uk' && tx.category.nameUk ? tx.category.nameUk : tx.category.nameEn}</td>
                  <td>{tx.account.name}</td>
                  <td className={styles.amount}>
                    {tx.type === 2 ? '-' : '+'}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.account.currency.code}
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.note || '-'}
                  </td>
                  <td>
                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                      <button className={styles.actionBtn} onClick={() => openEditModal(tx)}>
                        <Edit2 size={16} />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(tx.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn btn-text" style={{ position: 'absolute', right: '16px', top: '16px', padding: '4px' }} onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>
              {showCreateModal ? 'Add Transaction' : 'Edit Transaction'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Balances are automatically updated based on the account chosen.
            </p>

            {actionError && (
              <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '13px' }}>
                <ShieldAlert size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={showCreateModal ? handleCreate : handleEdit}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="type" value="2" checked={type === 2} onChange={(e) => setType(parseInt(e.target.value, 10))} />
                    Expense
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="type" value="1" checked={type === 1} onChange={(e) => setType(parseInt(e.target.value, 10))} />
                    Income
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Account</label>
                <select className="form-control" style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }} value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} required>
                  <option value="" disabled>Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }} value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} required>
                  <option value="" disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {locale === 'uk' && cat.nameUk ? cat.nameUk : cat.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Amount</label>
                  <input type="number" step="0.01" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Note (Optional)</label>
                <input type="text" className="form-control" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <div className="spinner"></div> : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
