import { API_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Plus, Tags, Edit2, Trash2, ShieldAlert, X } from 'lucide-react';
import styles from './Categories.module.css';

interface Category {
  id: string;
  nameEn: string | null;
  nameUk: string | null;
  type: number; // 1 for Income, 2 for Expense
  user: any | null; // null means global
  createdAt: string;
}

interface Budget {
  id: string;
  limitAmount: string | number;
  period: number; // 1=Weekly, 2=Monthly, 3=Yearly
  startDate: string;
  category: { id: string };
  spentAmount?: number;
}

interface CategoriesProps {
  token: string;
  locale: 'en' | 'uk';
}

export const Categories: React.FC<CategoriesProps> = ({ token, locale }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);

  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Forms state
  const [nameEn, setNameEn] = useState('');
  const [nameUk, setNameUk] = useState('');
  const [type, setType] = useState(2); // Default to Expense (2)
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Budget Form State
  const [budgetLimit, setBudgetLimit] = useState('0');
  const [budgetPeriod, setBudgetPeriod] = useState(2);
  const [budgetStartDate, setBudgetStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Load categories and budgets
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, budgRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/categories?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/v1/budgets`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      if (!catRes.ok) throw new Error('Failed to retrieve categories.');
      if (!budgRes.ok) throw new Error('Failed to retrieve budgets.');

      const catData = await catRes.json();
      const budgData = await budgRes.json();
      
      setCategories(catData);
      setBudgets(budgData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Create category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !nameUk.trim()) {
      setActionError('At least one language name must be provided.');
      return;
    }
    setActionError(null);
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameEn: nameEn.trim() || null,
          nameUk: nameUk.trim() || null,
          type: parseInt(type.toString(), 10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create category.');
      }

      setShowCreateModal(false);
      setNameEn('');
      setNameUk('');
      setType(2);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during category creation.');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit category
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    if (!nameEn.trim() && !nameUk.trim()) {
      setActionError('At least one language name must be provided.');
      return;
    }

    setActionError(null);
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/categories/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameEn: nameEn.trim() || null,
          nameUk: nameUk.trim() || null,
          type: parseInt(type.toString(), 10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update category.');
      }

      setShowEditModal(false);
      setSelectedCategory(null);
      setNameEn('');
      setNameUk('');
      setType(2);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during category update.');
    } finally {
      setActionLoading(false);
    }
  };

  // Soft Delete category
  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/v1/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete category.');
      }

      fetchData();
    } catch (err: any) {
      setError(err.message || 'An error occurred during category deletion.');
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    
    setActionError(null);
    setActionLoading(true);

    try {
      const url = activeBudget 
        ? `${API_URL}/api/v1/budgets/${activeBudget.id}`
        : `${API_URL}/api/v1/budgets`;
        
      const method = activeBudget ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          limitAmount: parseFloat(budgetLimit),
          period: budgetPeriod,
          startDate: budgetStartDate
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save budget.');
      }

      setShowBudgetModal(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!activeBudget) return;
    if (!window.confirm('Are you sure you want to remove this budget?')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/budgets/${activeBudget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete budget.');
      setShowBudgetModal(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = () => {
    setNameEn('');
    setNameUk('');
    setType(2);
    setActionError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setNameEn(category.nameEn || '');
    setNameUk(category.nameUk || '');
    setType(category.type);
    setActionError(null);
    setShowEditModal(true);
  };

  const openBudgetModal = (category: Category) => {
    const existingBudget = budgets.find(b => b.category?.id === category.id);
    setSelectedCategory(category);
    setActiveBudget(existingBudget || null);
    
    setBudgetLimit(existingBudget ? existingBudget.limitAmount.toString() : '0');
    setBudgetPeriod(existingBudget ? existingBudget.period : 2); // default monthly
    setBudgetStartDate(existingBudget ? new Date(existingBudget.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    
    setActionError(null);
    setShowBudgetModal(true);
  };

  return (
    <>
      <div className={styles.categoriesHeader}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Categories</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Manage transaction categories to organize your finances.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          <span>New Category</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '16px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className={styles.emptyState}>
          <Tags className={styles.emptyIcon} size={48} />
          <h3 className={styles.emptyTitle}>No categories available</h3>
          <p className={styles.emptyDescription}>Create categories to classify your income and expenses.</p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>New Category</span>
          </button>
        </div>
      ) : (
        <div className={styles.categoriesGrid}>
          {categories.map((category) => {
            const displayName = locale === 'uk' ? (category.nameUk || category.nameEn) : (category.nameEn || category.nameUk);

            return (
              <div 
                key={category.id} 
                className={`card ${styles.categoryCard} ${category.type === 1 ? styles.typeIncome : styles.typeExpense}`}
              >
                <div className={styles.categoryMeta}>
                  <div>
                    <h3 className={styles.categoryName}>{displayName}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Created: {new Date(category.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                    <div>
                    <span className={`${styles.badge} ${category.type === 1 ? styles.badgeIncome : styles.badgeExpense}`}>
                      {category.type === 1 ? 'Income' : 'Expense'}
                    </span>
                    {!category.user && (
                      <span className={`${styles.badge} ${styles.badgeGlobal}`}>Global</span>
                    )}
                  </div>
                </div>

                {/* Display Budget if exists */}
                {budgets.find(b => b.category?.id === category.id) && (() => {
                  const budget = budgets.find(b => b.category?.id === category.id)!;
                  const spent = Number(budget.spentAmount || 0);
                  const limit = Number(budget.limitAmount);
                  const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                  
                  let progressColor = 'var(--accent-success)';
                  if (progress >= 100) progressColor = 'var(--accent-danger)';
                  else if (progress >= 75) progressColor = 'var(--accent-warning)';
                  
                  return (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: `1px solid ${progress >= 100 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Budget ({budget.period === 1 ? 'Weekly' : budget.period === 2 ? 'Monthly' : 'Yearly'})
                        </span>
                        <strong style={{ color: progress >= 100 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                          ${spent.toLocaleString()} / ${limit.toLocaleString()}
                        </strong>
                      </div>
                      
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${progress}%`, 
                          background: progressColor,
                          transition: 'width 0.5s ease-out, background 0.5s ease-out'
                        }} />
                      </div>
                      
                      {progress >= 100 && (
                        <div style={{ marginTop: '8px', color: 'var(--accent-danger)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={12} />
                          <span>Budget exceeded!</span>
                        </div>
                      )}
                      {progress >= 75 && progress < 100 && (
                        <div style={{ marginTop: '8px', color: 'var(--accent-warning)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={12} />
                          <span>Approaching limit.</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className={styles.categoryActions} style={{ justifyContent: category.user ? 'flex-end' : 'flex-end' }}>
                  <button className="btn btn-text" onClick={() => openBudgetModal(category)}>
                    <Tags size={14} />
                    <span>{budgets.find(b => b.category?.id === category.id) ? 'Edit Budget' : 'Set Budget'}</span>
                  </button>
                  {category.user && (
                    <>
                      <button className="btn btn-text" onClick={() => openEditModal(category)}>
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button className="btn btn-text" style={{ color: 'var(--accent-danger)' }} onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn btn-text" style={{ position: 'absolute', right: '16px', top: '16px', padding: '4px' }} onClick={() => setShowCreateModal(false)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>New Category</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Create a custom category for your transactions.
            </p>

            {actionError && (
              <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '13px' }}>
                <ShieldAlert size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name (English)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Groceries"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Name (Ukrainian)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="наприклад: Продукти"
                  value={nameUk}
                  onChange={(e) => setNameUk(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Type</label>
                <select
                  className="form-control"
                  style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}
                  value={type}
                  onChange={(e) => setType(parseInt(e.target.value, 10))}
                  required
                >
                  <option value={1}>Income</option>
                  <option value={2}>Expense</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <div className="spinner"></div> : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn btn-text" style={{ position: 'absolute', right: '16px', top: '16px', padding: '4px' }} onClick={() => setShowEditModal(false)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>Edit Category</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Modify details of your custom category.
            </p>

            {actionError && (
              <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '13px' }}>
                <ShieldAlert size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleEditCategory}>
              <div className="form-group">
                <label className="form-label">Category Name (English)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Groceries"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Name (Ukrainian)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="наприклад: Продукти"
                  value={nameUk}
                  onChange={(e) => setNameUk(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Type</label>
                <select
                  className="form-control"
                  style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}
                  value={type}
                  onChange={(e) => setType(parseInt(e.target.value, 10))}
                  required
                >
                  <option value={1}>Income</option>
                  <option value={2}>Expense</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedCategory(null); }}>
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

      {/* BUDGET MODAL */}
      {showBudgetModal && selectedCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn btn-text" style={{ position: 'absolute', right: '16px', top: '16px', padding: '4px' }} onClick={() => setShowBudgetModal(false)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>{activeBudget ? 'Edit Budget' : 'Set Budget'}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Set a spending limit for <strong>{locale === 'uk' ? (selectedCategory.nameUk || selectedCategory.nameEn) : (selectedCategory.nameEn || selectedCategory.nameUk)}</strong>.
            </p>

            {actionError && (
              <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '13px' }}>
                <ShieldAlert size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBudget}>
              <div className="form-group">
                <label className="form-label">Limit Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Period</label>
                <select
                  className="form-control"
                  style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }}
                  value={budgetPeriod}
                  onChange={(e) => setBudgetPeriod(parseInt(e.target.value, 10))}
                  required
                >
                  <option value={1}>Weekly</option>
                  <option value={2}>Monthly</option>
                  <option value={3}>Yearly</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={budgetStartDate}
                  onChange={(e) => setBudgetStartDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                {activeBudget && (
                  <button type="button" className="btn btn-text" style={{ color: 'var(--accent-danger)', marginRight: 'auto' }} onClick={handleDeleteBudget} disabled={actionLoading}>
                    Remove Budget
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={() => setShowBudgetModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <div className="spinner"></div> : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
