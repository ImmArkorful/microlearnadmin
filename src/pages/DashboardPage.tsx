import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { StatsCard } from '../components/StatsCard';
import type { DashboardStats } from '../types/admin';
import './DashboardPage.css';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Dashboard Overview</h1>

      <div className="dashboard__stats-grid">
        <StatsCard
          title="Total Users"
          value={stats.users.total}
          subtitle={`${stats.users.active} active, ${stats.users.new} new this month`}
          icon="👥"
        />
        <StatsCard
          title="Total Lessons"
          value={stats.lessons.total}
          subtitle={`${stats.lessons.byCategory.length} categories`}
          icon="📚"
        />
        <StatsCard
          title="Total Quizzes"
          value={stats.quizzes.total}
          subtitle={`${stats.quizzes.active} active`}
          icon="❓"
        />
        <StatsCard
          title="Quiz Attempts"
          value={stats.quizAttempts.total}
          subtitle={`${stats.quizAttempts.successRate}% success rate`}
          icon="📊"
        />
      </div>

      <div className="dashboard__sections">
        <div className="dashboard__section">
          <h2 className="dashboard__section-title">Lessons by Category</h2>
          <div className="dashboard__category-list">
            {stats.lessons.byCategory.map((item) => (
              <div key={item.category} className="dashboard__category-item">
                <span className="dashboard__category-name">{item.category}</span>
                <span className="dashboard__category-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard__section">
          <h2 className="dashboard__section-title">Recent Activity</h2>
          <div className="dashboard__activity-list">
            {stats.recentActivity.slice(0, 10).map((activity, index) => (
              <div key={index} className="dashboard__activity-item">
                <span className="dashboard__activity-type">{activity.type}</span>
                <span className="dashboard__activity-description">{activity.description}</span>
                <span className="dashboard__activity-date">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
