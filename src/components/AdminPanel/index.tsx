import { API_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Users, Settings, ArrowLeft, RefreshCw, ShieldAlert, Edit2, Trash2, X } from 'lucide-react';
import styles from './AdminPanel.module.css';

interface AdminPanelProps {
  token: string;
  onBackToDashboard: () => void;
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: { id: number; name?: string } | null;
  status: { id: number; name?: string } | null;
  createdAt: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ token, onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'SETTINGS'>('USERS');
  
  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Edit User Modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState(2); // 1 = Admin, 2 = User
  const [editStatus, setEditStatus] = useState(1); // 1 = Active, 2 = Inactive
  const [actionLoading, setActionLoading] = useState(false);

  // Settings State
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'USERS') {
      fetchUsers();
    } else {
      fetchCurrencies();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await fetch(`${API_URL}/api/v1/users?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.data || []);
    } catch (err: any) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    setCurrenciesLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/currencies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch currencies');
      const data = await response.json();
      setCurrencies(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCurrenciesLoading(false);
    }
  };

  const handleSyncCurrencies = async () => {
    setSyncLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/currencies/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Sync failed');
      alert('Currencies synced successfully!');
      fetchCurrencies();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to completely delete this user?')) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete user');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: { id: editRole },
          status: { id: editStatus }
        })
      });
      if (!response.ok) throw new Error('Failed to update user');
      setShowEditUserModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role?.id || 2);
    setEditStatus(user.status?.id || 1);
    setShowEditUserModal(true);
  };

  return (
    <div className={styles.container}>
      <button className="btn btn-text" style={{ marginBottom: '24px' }} onClick={onBackToDashboard}>
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </button>

      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Admin Panel</h2>
          <p className={styles.subtitle}>Manage platform users and global settings.</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'USERS' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('USERS')}
        >
          <Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Users Management
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'SETTINGS' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('SETTINGS')}
        >
          <Settings size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          System Settings
        </button>
      </div>

      {activeTab === 'USERS' && (
        <>
          {usersError && (
            <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
              <ShieldAlert size={20} />
              <span>{usersError}</span>
            </div>
          )}

          {usersLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User / Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${u.role?.id === 1 ? styles.badgeAdmin : styles.badgeUser}`}>
                          {u.role?.id === 1 ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${u.status?.id === 1 ? styles.badgeActive : styles.badgeInactive}`}>
                          {u.status?.id === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                          <button className="btn btn-text" onClick={() => openEditModal(u)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-text" style={{ color: 'var(--accent-danger)' }} onClick={() => handleDeleteUser(u.id)}>
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
        </>
      )}

      {activeTab === 'SETTINGS' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px' }}>Currencies Setup</h3>
            <button className="btn btn-primary" onClick={handleSyncCurrencies} disabled={syncLoading}>
              {syncLoading ? <div className="spinner"></div> : <RefreshCw size={16} />}
              <span>Sync from API</span>
            </button>
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Symbol</th>
                </tr>
              </thead>
              <tbody>
                {currenciesLoading ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}><div className="spinner"></div></td></tr>
                ) : currencies.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No currencies loaded. Sync from API first.</td></tr>
                ) : (
                  currencies.map(c => (
                    <tr key={c.code}>
                      <td style={{ fontWeight: 600 }}>{c.code}</td>
                      <td>{c.name}</td>
                      <td>{c.symbol || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* EDIT USER MODAL */}
      {showEditUserModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn btn-text" style={{ position: 'absolute', right: '16px', top: '16px', padding: '4px' }} onClick={() => setShowEditUserModal(false)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Edit User Permissions</h3>

            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }} value={editRole} onChange={(e) => setEditRole(parseInt(e.target.value, 10))} required>
                  <option value={1}>Admin</option>
                  <option value={2}>User</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" style={{ appearance: 'none', background: 'rgba(17, 24, 39, 0.8)' }} value={editStatus} onChange={(e) => setEditStatus(parseInt(e.target.value, 10))} required>
                  <option value={1}>Active</option>
                  <option value={2}>Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditUserModal(false)}>Cancel</button>
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
