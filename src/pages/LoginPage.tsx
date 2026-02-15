import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminAnalytics } from '../services/adminAnalytics';
import './LoginPage.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    adminAnalytics.track('admin_login_attempted', {
      email_domain: email.includes('@') ? email.split('@')[1] : 'unknown',
    });

    try {
      await login(email, password);
      adminAnalytics.track('admin_login_success', {
        email_domain: email.includes('@') ? email.split('@')[1] : 'unknown',
      });
      navigate('/dashboard');
    } catch (err: any) {
      adminAnalytics.track('admin_login_failed', {
        error_message: err?.message || 'unknown_error',
      });
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__container">
        <div className="admin-login__card">
          <h1 className="admin-login__title">Admin Dashboard</h1>
          <p className="admin-login__subtitle">Sign in to access the admin panel</p>

          {error && <div className="admin-login__error">{error}</div>}

          <form onSubmit={handleSubmit} className="admin-login__form">
            <div className="admin-login__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="admin@example.com"
              />
            </div>

            <div className="admin-login__field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="admin-login__button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
