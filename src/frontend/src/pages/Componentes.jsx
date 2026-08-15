import { useState, useEffect } from 'react';
import { obtenerEquipos } from '../services/equiposService';
import { useMonitorEquipo } from '../services/agenteService';
import GaugeRing from '../components/monitor/GaugeRing';
import MonitorSparkline from '../components/monitor/MonitorSparkline';
import { MonitorIcon } from '../components/Icons';
import './Componentes.css';

const EquipoListItem = ({ equipo, activo, onClick }) => (
  <button className={`equipo-item ${activo ? 'equipo-item--active' : ''}`} onClick={onClick}>
    <span className="equipo-item__icon"><MonitorIcon size={16} /></span>
    <span className="equipo-item__info">
      <span className="equipo-item__name">{equipo.nombre}</span>
      <span className="equipo-item__meta">{equipo.marca} · {equipo.serial}</span>
    </span>
  </button>
);

const MonitorEquipo = ({ equipo }) => {
  // Simulado mientras no exista el agente + backend WebSocket reales.
  const { snapshot, historial } = useMonitorEquipo(equipo.id, true);

  return (
    <div className="monitor-equipo">
      <div className="monitor-equipo__header">
        <div>
          <h3>{equipo.nombre}</h3>
          <span className="monitor-equipo__meta">{equipo.marca} {equipo.modelo} · {equipo.serial}</span>
        </div>
        <span className="monitor-badge monitor-badge--demo">Datos de ejemplo — agente aún no conectado</span>
      </div>

      <div className="monitor-grid">
        <GaugeRing label="CPU Load" value={snapshot?.cpuLoad} unit="%" color="#6366f1" />
        <GaugeRing label="Memory Load" value={snapshot?.memLoad} unit="%" color="#a855f7" />
        <MonitorSparkline label="GPU Core Clock" data={historial.gpuClock} currentValue={snapshot?.gpuClock} unit=" MHz" color="#3b82f6" />
        <MonitorSparkline label="CPU Temperature" data={historial.cpuTemp} currentValue={snapshot?.cpuTemp} unit="°C" color="#f59e0b" />
        <GaugeRing label="GPU Hotspot" value={snapshot?.gpuTemp} unit="°C" max={100} color="#ef4444" />
      </div>
    </div>
  );
};

const Componentes = () => {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const data = await obtenerEquipos({ limit: 50 });
        const lista = Array.isArray(data) ? data : data.data || [];
        setEquipos(lista);
        if (lista.length > 0) setSeleccionado(lista[0]);
      } catch (err) {
        console.error('Error cargando equipos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipos();
  }, []);

  return (
    <div className="componentes-container animate-fade-in">
      <div className="componentes-header">
        <h1>Componentes</h1>
        <p>Monitoreo de hardware en tiempo real de los equipos registrados.</p>
      </div>

      <div className="componentes-layout">
        <aside className="equipos-sidebar">
          {loading && <p className="equipos-sidebar__loading">Cargando equipos...</p>}
          {!loading && equipos.length === 0 && (
            <p className="equipos-sidebar__empty">No hay equipos registrados.</p>
          )}
          {equipos.map((eq) => (
            <EquipoListItem
              key={eq.id}
              equipo={eq}
              activo={seleccionado?.id === eq.id}
              onClick={() => setSeleccionado(eq)}
            />
          ))}
        </aside>

        <main className="monitor-panel">
          {seleccionado ? (
            <MonitorEquipo equipo={seleccionado} />
          ) : (
            <div className="monitor-panel__empty">Selecciona un equipo para ver sus componentes.</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Componentes;