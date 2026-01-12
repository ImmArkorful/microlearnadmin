import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import './AdminNav.css';

export function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/lessons', label: 'Lessons', icon: '📚' },
    { path: '/quizzes', label: 'Quizzes', icon: '❓' },
    { path: '/quiz-answers', label: 'Quiz Answers', icon: '📝' },
    { path: '/generate-topics', label: 'Generate Topics', icon: '✨' },
  ];

  return (
    <nav className="admin-nav">
      <div className="admin-nav__header">
        <h1 className="admin-nav__title">Admin Panel</h1>
      </div>

      <ul className="admin-nav__list">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`admin-nav__link ${location.pathname === item.path ? 'admin-nav__link--active' : ''}`}
            >
              <span className="admin-nav__icon">{item.icon}</span>
              <span className="admin-nav__label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="admin-nav__footer">
        <div className="admin-nav__user">
          <span className="admin-nav__user-email">{admin?.email}</span>
          <span className="admin-nav__user-role">Admin</span>
        </div>
        <button className="admin-nav__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
