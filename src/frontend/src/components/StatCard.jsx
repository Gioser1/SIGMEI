import './StatCard.css';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const StatCard = ({ title, value, percent = 100, type = 'primary', icon }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const gradientId = `gauge-gradient-${type}`;

  return (
    <div className={`gauge-card gauge-card--${type}`}>
      <div className="gauge-card__header">
        <span className="gauge-card__icon">{icon}</span>
        <span className="gauge-card__title">{title}</span>
      </div>

      <div className="gauge-card__ring-wrap">
        <svg className="gauge-card__ring" viewBox="0 0 120 120">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className="gauge-card__stop-start" />
              <stop offset="100%" className="gauge-card__stop-end" />
            </linearGradient>
          </defs>
          <circle
            className="gauge-card__track"
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
          />
          <circle
            className="gauge-card__value-arc"
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            stroke={`url(#${gradientId})`}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="gauge-card__value">
          <span className="gauge-card__number">{value}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;