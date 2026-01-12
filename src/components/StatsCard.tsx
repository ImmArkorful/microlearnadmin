import './StatsCard.css';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="stats-card__header">
        <h3 className="stats-card__title">{title}</h3>
        {icon && <span className="stats-card__icon">{icon}</span>}
      </div>
      <div className="stats-card__value">{value}</div>
      {subtitle && <p className="stats-card__subtitle">{subtitle}</p>}
      {trend && (
        <div className={`stats-card__trend ${trend.isPositive ? 'stats-card__trend--positive' : 'stats-card__trend--negative'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  );
}
