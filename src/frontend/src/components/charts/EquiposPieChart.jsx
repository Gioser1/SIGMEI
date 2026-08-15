import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const EquiposPieChart = ({ totalEquipos = 0, equiposActivos = 0 }) => {
  const inactivos = Math.max(totalEquipos - equiposActivos, 0);
  const porcentajeActivos = totalEquipos > 0 ? Math.round((equiposActivos / totalEquipos) * 100) : 0;

  const data = [
    { name: 'Activos', value: equiposActivos },
    { name: 'Inactivos', value: inactivos },
  ];

  if (totalEquipos === 0) {
    return <div className="chart-empty-state">No hay equipos registrados todavía.</div>;
  }

  return (
    <div className="donut-chart-wrap">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <defs>
            <linearGradient id="donut-activos" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <filter id="donut-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={95}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
            style={{ filter: 'url(#donut-glow)' }}
          >
            <Cell fill="url(#donut-activos)" stroke="var(--bg-surface)" strokeWidth={2} />
            <Cell fill="var(--neutral-700)" stroke="var(--bg-surface)" strokeWidth={2} />
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="donut-chart-center">
        <span className="donut-chart-center__value">{porcentajeActivos}%</span>
        <span className="donut-chart-center__label">Activos</span>
      </div>

      <div className="donut-chart-legend">
        <span className="donut-chart-legend__item">
          <i className="donut-dot donut-dot--success" /> Activos ({equiposActivos})
        </span>
        <span className="donut-chart-legend__item">
          <i className="donut-dot donut-dot--neutral" /> Inactivos ({inactivos})
        </span>
      </div>
    </div>
  );
};

export default EquiposPieChart;