import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { StatsCard } from '../components/StatsCard';
import type {
  DashboardStats,
  QualityQueueResponse,
  FunnelResponse,
  AiObservabilityResponse,
  AiObservabilityByEndpoint,
  QualityQueueTopic,
} from '../types/admin';
import './DashboardPage.css';

const timeframeOptions: Array<{ value: number | 'all'; label: string }> = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
  { value: 'all', label: 'All time' },
];

const formatPct = (value: number) => `${Math.max(0, Number(value || 0)).toFixed(1)}%`;

const safeRate = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

function toQualityScore(score?: number | null) {
  if (typeof score !== 'number') return 'Unrated';
  return `${Math.round(score)}%`;
}

function endpointErrorRate(item: AiObservabilityByEndpoint) {
  return safeRate(item.failed_calls, item.total_calls);
}

function severityFromScore(score?: number | null) {
  if (typeof score !== 'number') return 'neutral';
  if (score < 45) return 'high';
  if (score < 70) return 'medium';
  return 'low';
}

function scoreTone(score: number) {
  if (score >= 70) return 'good';
  if (score >= 40) return 'warning';
  return 'bad';
}

function renderQualityMeta(topic: QualityQueueTopic) {
  const flags = topic.total_flags || 0;
  const quality = toQualityScore(topic.overall_quality_score);
  return `${quality} · ${flags} flags`;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [qualityQueue, setQualityQueue] = useState<QualityQueueResponse | null>(null);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [aiObservability, setAiObservability] = useState<AiObservabilityResponse | null>(null);
  const [timeframeDays, setTimeframeDays] = useState<number | 'all'>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError('');
        const [statsData, qualityData, funnelData, observabilityData] = await Promise.all([
          adminService.getStats(),
          adminService.getQualityQueue(12),
          adminService.getFunnel(timeframeDays),
          adminService.getAiObservability(timeframeDays),
        ]);

        setStats(statsData);
        setQualityQueue(qualityData);
        setFunnel(funnelData);
        setAiObservability(observabilityData);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [timeframeDays]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">Loading phase 1 metrics...</div>
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

  const signups = funnel?.funnel.signups || 0;
  const onboarding = funnel?.funnel.onboarding_completed || 0;
  const firstLesson = funnel?.funnel.first_lesson_started || 0;
  const firstQuiz = funnel?.funnel.first_quiz_completed || 0;

  const onboardingRate = safeRate(onboarding, signups);
  const lessonRate = safeRate(firstLesson, signups);
  const quizRate = safeRate(firstQuiz, signups);

  const aiTotal = aiObservability?.summary.total_calls || 0;
  const aiFailed = aiObservability?.summary.failed_calls || 0;
  const aiErrorRate = safeRate(aiFailed, aiTotal);
  const avgLatency = Math.round(aiObservability?.summary.avg_latency_ms || 0);

  const topEndpoints = (aiObservability?.by_endpoint || [])
    .slice()
    .sort((a, b) => endpointErrorRate(b) - endpointErrorRate(a))
    .slice(0, 6);

  const lowQualityTopics = qualityQueue?.lowQualityTopics || [];
  const flaggedTopics = qualityQueue?.userFlaggedTopics || [];

  return (
    <div className="dashboard">
      <section className="dashboard__hero">
        <div>
          <h1 className="dashboard__title">Phase 1 Command Center</h1>
          <p className="dashboard__subtitle">
            Track onboarding conversion, AI reliability, and content quality in one view.
          </p>
        </div>
        <div className="dashboard__timeframe-pills">
          {timeframeOptions.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              className={`dashboard__pill ${timeframeDays === option.value ? 'is-active' : ''}`}
              onClick={() => setTimeframeDays(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <div className="dashboard__stats-grid">
        <StatsCard
          title="Signup → Onboarding"
          value={formatPct(onboardingRate)}
          subtitle={`${onboarding}/${signups} users`}
          icon="🚀"
        />
        <StatsCard
          title="Signup → First Lesson"
          value={formatPct(lessonRate)}
          subtitle={`${firstLesson}/${signups} users`}
          icon="📘"
        />
        <StatsCard
          title="Signup → First Quiz"
          value={formatPct(quizRate)}
          subtitle={`${firstQuiz}/${signups} users`}
          icon="✅"
        />
        <StatsCard
          title="AI Error Rate"
          value={formatPct(aiErrorRate)}
          subtitle={`${aiFailed}/${aiTotal} failed calls`}
          icon="🤖"
        />
      </div>

      <div className="dashboard__grid">
        <section className="dashboard__panel dashboard__panel--funnel">
          <div className="dashboard__panel-head">
            <h2 className="dashboard__section-title">Phase 1 Funnel</h2>
            <span className="dashboard__chip">Activation</span>
          </div>
          <div className="dashboard__funnel-visual">
            {[
              { label: 'Signups', count: signups, pct: 100 },
              { label: 'Onboarding Complete', count: onboarding, pct: onboardingRate },
              { label: 'First Lesson Started', count: firstLesson, pct: lessonRate },
              { label: 'First Quiz Completed', count: firstQuiz, pct: quizRate },
            ].map((step) => (
              <div className="dashboard__funnel-step" key={step.label}>
                <div className="dashboard__funnel-row">
                  <span>{step.label}</span>
                  <strong>{step.count}</strong>
                </div>
                <div className="dashboard__progress">
                  <div
                    className="dashboard__progress-fill"
                    style={{ width: `${Math.max(2, Math.min(100, step.pct))}%` }}
                  />
                </div>
                <small>{formatPct(step.pct)}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard__panel dashboard__panel--ai">
          <div className="dashboard__panel-head">
            <h2 className="dashboard__section-title">AI Observability</h2>
            <span className={`dashboard__status ${scoreTone(100 - aiErrorRate)}`}>
              {aiErrorRate < 3 ? 'Healthy' : aiErrorRate < 7 ? 'Watch' : 'At Risk'}
            </span>
          </div>
          <div className="dashboard__ai-kpis">
            <div>
              <p>Total Calls</p>
              <strong>{aiTotal}</strong>
            </div>
            <div>
              <p>Failed Calls</p>
              <strong>{aiFailed}</strong>
            </div>
            <div>
              <p>Avg Latency</p>
              <strong>{avgLatency}ms</strong>
            </div>
          </div>
          <div className="dashboard__endpoint-list">
            {topEndpoints.length === 0 ? (
              <p className="dashboard__muted">No endpoint data available.</p>
            ) : (
              topEndpoints.map((endpoint, index) => {
                const rate = endpointErrorRate(endpoint);
                return (
                  <div className="dashboard__endpoint-item" key={`${endpoint.endpoint}-${endpoint.model || index}`}>
                    <div className="dashboard__endpoint-top">
                      <span className="dashboard__endpoint-name">{endpoint.endpoint}</span>
                      <span className="dashboard__endpoint-meta">{formatPct(rate)} errors</span>
                    </div>
                    <div className="dashboard__endpoint-sub">
                      <span>{endpoint.model || 'n/a'}</span>
                      <span>{endpoint.total_calls} calls</span>
                    </div>
                    <div className="dashboard__progress dashboard__progress--danger">
                      <div
                        className="dashboard__progress-fill"
                        style={{ width: `${Math.max(2, Math.min(100, rate))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="dashboard__panel dashboard__panel--quality">
          <div className="dashboard__panel-head">
            <h2 className="dashboard__section-title">Quality Queue</h2>
            <span className="dashboard__chip dashboard__chip--warn">Needs Review</span>
          </div>
          <div className="dashboard__quality-columns">
            <div>
              <h3>Low Score Topics</h3>
              <div className="dashboard__quality-list">
                {lowQualityTopics.length === 0 ? (
                  <p className="dashboard__muted">No low score topics.</p>
                ) : (
                  lowQualityTopics.slice(0, 6).map((topic) => (
                    <div
                      key={`low-${topic.id}`}
                      className={`dashboard__quality-item severity-${severityFromScore(topic.overall_quality_score)}`}
                    >
                      <div>
                        <strong>{topic.topic}</strong>
                        <small>{topic.category}</small>
                      </div>
                      <span>{renderQualityMeta(topic)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3>User-Flagged Topics</h3>
              <div className="dashboard__quality-list">
                {flaggedTopics.length === 0 ? (
                  <p className="dashboard__muted">No flagged topics.</p>
                ) : (
                  flaggedTopics.slice(0, 6).map((topic) => (
                    <div key={`flag-${topic.id}`} className="dashboard__quality-item severity-medium">
                      <div>
                        <strong>{topic.topic}</strong>
                        <small>{topic.category}</small>
                      </div>
                      <span>{topic.total_flags || 0} flags</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard__panel">
          <div className="dashboard__panel-head">
            <h2 className="dashboard__section-title">Lessons by Category</h2>
          </div>
          <div className="dashboard__category-list">
            {stats.lessons.byCategory.map((item) => (
              <div key={item.category} className="dashboard__category-item">
                <span className="dashboard__category-name">{item.category}</span>
                <span className="dashboard__category-count">{item.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard__panel">
          <div className="dashboard__panel-head">
            <h2 className="dashboard__section-title">Recent Activity</h2>
          </div>
          <div className="dashboard__activity-list">
            {stats.recentActivity.slice(0, 8).map((activity, index) => (
              <div key={index} className="dashboard__activity-item">
                <span className="dashboard__activity-type">{activity.type}</span>
                <span className="dashboard__activity-description">{activity.description}</span>
                <span className="dashboard__activity-date">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
