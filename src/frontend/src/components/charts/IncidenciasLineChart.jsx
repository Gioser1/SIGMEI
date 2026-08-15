import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_DATA = [
  { fecha: 'Lun', abiertas: 2, resueltas: 1 },
  { fecha: 'Mar', abiertas: 1, resueltas: 2 },
  { fecha: 'Mié', abiertas: 3, resueltas: 1 },
  { fecha: 'Jue', abiertas: 0, resueltas: 2 },
  { fecha: 'Vie', abiertas: 1, resueltas: 1 },
  { fecha: 'Sáb', abiertas: 0, resueltas: 0 },
  { fecha: 'Dom', abiertas: 0, resueltas: 0 },
];

const IncidenciasLineChart = ({ data = MOCK_DATA }) => {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="area-abiertas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="area-resueltas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
        <XAxis dataKey="fecha" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="abiertas"
          name="Abiertas"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#area-abiertas)"
          dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
          style={{ filter: 'url(#line-glow)' }}
        />
        <Area
          type="monotone"
          dataKey="resueltas"
          name="Resueltas"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#area-resueltas)"
          dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
          style={{ filter: 'url(#line-glow)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default IncidenciasLineChart;