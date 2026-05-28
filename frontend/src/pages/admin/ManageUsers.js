import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['admin', 'cooperatore', 'customer'];

export default function ManageUsers() {
  const { t } = useTranslation();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);

  const load = () => api.get('/api/admin/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    await api.put(`/api/admin/users/${id}/role`, { role });
    load();
  };

  const roleBadge = role => <span className={`badge badge-${role === 'cooperatore' ? 'shopkeeper' : role}`}>{role}</span>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>{t('manageUsers')}</h2>
      <table>
        <thead><tr><th>ID</th><th>{t('email')}</th><th>{t('role')}</th><th>{t('role')}</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{roleBadge(u.role)}</td>
              <td>
                {u.email === me?.email
                  ? <span style={{ fontSize: 13, color: '#888' }}>— (you)</span>
                  : (
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                      style={{ width: 'auto', marginBottom: 0 }}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
