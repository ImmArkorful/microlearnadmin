import { useState, useEffect } from 'react';
import type { User } from '../types/admin';
import './Form.css';

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: { email: string; role: 'user' | 'admin' }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, loading = false }: UserFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      await onSubmit({ email, role });
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="form__error">{error}</div>}

      <div className="form__field">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="form__field">
        <label htmlFor="role">Role *</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
          required
          disabled={loading}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="form__actions">
        <button type="button" className="form__button form__button--cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="form__button form__button--submit" disabled={loading}>
          {loading ? 'Saving...' : user ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
