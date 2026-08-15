import { useState, useEffect } from 'react';
import { obtenerResumenDashboard } from '../services/dashboardService';
import StatCard from '../components/StatCard';
import EquiposPieChart from '../components/charts/EquiposPieChart';
import IncidenciasLineChart from '../components/charts/IncidenciasLineChart';
import {
  MonitorIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  ShieldAlertIcon
} from '../components/Icons';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resumen = await obtenerResumenDashboard();
        setData(resumen);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('No se pudo cargar la información del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading animate-fade-in">
        <div className="spinner"></div>
        <p>Cargando métricas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error animate-fade-in">
        <ShieldAlertIcon size={48} className="error-icon" />
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Reintentar</button>
      </div>
    );
  }

  const totalEquipos = data?.total_equipos || 0;
  const equiposActivos = data?.equipos_activos || 0;
  const incidenciasAbiertas = data?.incidencias_abiertas || 0;
  const incidenciasResueltas = data?.incidencias_resueltas || 0;
  const mantPendientes = data?.mantenimientos_pendientes || 0;
  const mantCompletados = data?.mantenimientos_completados || 0;

  const hayAlerta = incidenciasAbiertas > 0;
  const totalIncidencias = incidenciasAbiertas + incidenciasResueltas;
  const totalMantenimientos = mantPendientes + mantCompletados;

  const pctEquiposActivos = totalEquipos > 0 ? (equiposActivos / totalEquipos) * 100 : 0;
  const pctIncidenciasAbiertas = totalIncidencias > 0 ? (incidenciasAbiertas / totalIncidencias) * 100 : 0;
  const pctIncidenciasResueltas = totalIncidencias > 0 ? (incidenciasResueltas / totalIncidencias) * 100 : 0;
  const pctMantPendientes = totalMantenimientos > 0 ? (mantPendientes / totalMantenimientos) * 100 : 0;
  const pctMantCompletados = totalMantenimientos > 0 ? (mantCompletados / totalMantenimientos) * 100 : 0;

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Resumen del Sistema</h1>
          <p>Métricas generales en tiempo real de la plataforma SIGMEI.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-secondary">
            <FileTextIcon size={16} />
            Generar Reporte
          </button>
        </div>
      </div>

      <div className={`executive-banner ${hayAlerta ? 'executive-banner--alert' : 'executive-banner--ok'}`}>
        <div className="executive-banner__icon">
          {hayAlerta ? <AlertCircleIcon size={20} /> : <ShieldAlertIcon size={20} />}
        </div>
        <div className="executive-banner__content">
          <span className="executive-banner__label">Estado Crítico del Sistema</span>
          <p className="executive-banner__text">
            {hayAlerta
              ? `Hay ${incidenciasAbiertas} incidencia${incidenciasAbiertas > 1 ? 's' : ''} abierta${incidenciasAbiertas > 1 ? 's' : ''} que requiere${incidenciasAbiertas > 1 ? 'n' : ''} atención.`
              : 'No hay incidencias abiertas. Todos los sistemas operan con normalidad.'}
          </p>
        </div>
        <span className="executive-banner__count">{incidenciasAbiertas}</span>
      </div>

      <div className="widgets-grid">
        <StatCard
          title="Total Equipos"
          value={totalEquipos}
          percent={100}
          type="primary"
          icon={<MonitorIcon size={16} />}
        />
        <StatCard
          title="Equipos Activos"
          value={equiposActivos}
          percent={pctEquiposActivos}
          type="success"
          icon={<CheckCircleIcon size={16} />}
        />
        <StatCard
          title="Incidencias Abiertas"
          value={incidenciasAbiertas}
          percent={pctIncidenciasAbiertas}
          type="danger"
          icon={<AlertCircleIcon size={16} />}
        />
        <StatCard
          title="Incidencias Resueltas"
          value={incidenciasResueltas}
          percent={pctIncidenciasResueltas}
          type="success"
          icon={<CheckCircleIcon size={16} />}
        />
        <StatCard
          title="Mant. Pendientes"
          value={mantPendientes}
          percent={pctMantPendientes}
          type="warning"
          icon={<ClockIcon size={16} />}
        />
        <StatCard
          title="Mant. Completados"
          value={mantCompletados}
          percent={pctMantCompletados}
          type="info"
          icon={<CheckCircleIcon size={16} />}
        />

        <section className="panel panel--wide">
          <header className="panel__header">
            <h3>Estado de Equipos</h3>
            <span>Distribución actual</span>
          </header>
          <div className="panel__body">
            <EquiposPieChart totalEquipos={totalEquipos} equiposActivos={equiposActivos} />
          </div>
        </section>

        <section className="panel panel--wide">
          <header className="panel__header">
            <h3>Incidencias Recientes</h3>
            <span>Últimos 7 días</span>
          </header>
          <div className="panel__body">
            <IncidenciasLineChart />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;