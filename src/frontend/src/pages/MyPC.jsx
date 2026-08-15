import { useState, useEffect, useContext, useRef } from 'react';
import { useHardwareLocal } from '../services/hardwareLocalService';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './MyPC.css';

/* =========================================
   Utilidades
   ========================================= */
/** Extrae el número de un valor como "45.2 °C" o "78.3 %" */
const parseNumericValue = (val) => {
  if (!val) return null;
  const match = String(val).match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
};

/** Devuelve la clase de color para temperaturas */
const tempClass = (value) => {
  if (value === null) return 'sensor-row__value--normal';
  if (value < 50) return 'sensor-row__value--cool';
  if (value < 75) return 'sensor-row__value--warm';
  return 'sensor-row__value--hot';
};

/** Devuelve la clase del fill de la barra según porcentaje */
const barFillClass = (pct) => {
  if (pct < 50) return 'sensor-bar__fill--low';
  if (pct < 80) return 'sensor-bar__fill--medium';
  return 'sensor-bar__fill--high';
};

/* =========================================
   Componentes de sensores
   ========================================= */

/** Fila simple: label → value */
const SensorRow = ({ label, value, colorize = false }) => {
  const num = parseNumericValue(value);
  let cls = 'sensor-row__value--normal';
  if (colorize && num !== null) cls = tempClass(num);

  return (
    <div className="sensor-row">
      <span className="sensor-row__label">{label}</span>
      <span className={`sensor-row__value ${cls}`}>{value || '—'}</span>
    </div>
  );
};

/** Barra de progreso con porcentaje */
const SensorBar = ({ label, value, color }) => {
  const pct = parseNumericValue(value);
  const clampedPct = pct !== null ? Math.min(100, Math.max(0, pct)) : 0;
  const fillClass = color === 'info' ? 'sensor-bar__fill--info' : barFillClass(clampedPct);

  return (
    <div className="sensor-bar">
      <div className="sensor-bar__header">
        <span className="sensor-bar__label">{label}</span>
        <span className="sensor-bar__value">{value || '—'}</span>
      </div>
      <div className="sensor-bar__track">
        <div className={`sensor-bar__fill ${fillClass}`} style={{ width: `${clampedPct}%` }} />
      </div>
    </div>
  );
};

/* =========================================
   Iconos SVG inline (para las tarjetas)
   ========================================= */
const CpuSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M15 2v2" /><path d="M15 20v2" />
    <path d="M2 15h2" /><path d="M2 9h2" />
    <path d="M20 15h2" /><path d="M20 9h2" />
    <path d="M9 2v2" /><path d="M9 20v2" />
  </svg>
);

const GpuSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="8" cy="12" r="2" />
    <path d="M14 10h4" /><path d="M14 14h4" />
  </svg>
);

const RamSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9Z" />
    <path d="M6 5v4" /><path d="M10 5v4" /><path d="M14 5v4" /><path d="M18 5v4" />
    <path d="M6 15h.01" /><path d="M10 15h.01" /><path d="M14 15h.01" /><path d="M18 15h.01" />
  </svg>
);

const DiskSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    <path d="M3 12a9 3 0 0 0 18 0" />
  </svg>
);

const MotherboardSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <rect x="6" y="6" width="4" height="4" />
    <rect x="14" y="14" width="4" height="4" />
    <path d="M6 14h4v4" /><path d="M14 6h4v4" />
  </svg>
);

const DisconnectedSvg = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 2v2" /><path d="M15 2v2" /><path d="M9 20v2" /><path d="M15 20v2" />
    <path d="M2 9h2" /><path d="M2 15h2" /><path d="M20 9h2" /><path d="M20 15h2" />
    <path d="M4 20 20 4" strokeWidth="2" stroke="#ef4444" />
  </svg>
);

/* =========================================
   Tarjeta de Hardware genérica
   ========================================= */
const HwCard = ({ title, name, iconClass, icon, sensors, allowManualRam = false }) => {
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualRamData, setManualRamData] = useState(() => {
    if (allowManualRam) {
      try {
        const saved = localStorage.getItem('manualRamData');
        return saved ? JSON.parse(saved) : null;
      } catch (e) { return null; }
    }
    return null;
  });
  const [formInput, setFormInput] = useState(manualRamData || { marca: '', tamano: '', velocidad: '' });

  // Separar sensores en loads (barras) y otros (filas)
  const loads = [];
  const temps = [];
  const others = [];

  if (sensors && typeof sensors === 'object') {
    Object.entries(sensors).forEach(([key, s]) => {
      const val = s.value || '';
      const isLoad = val.includes('%') || key.toLowerCase().includes('load') || key.toLowerCase().includes('usage');
      const isTemp = val.includes('°') || key.toLowerCase().includes('temp');

      if (isLoad) loads.push({ label: key, ...s });
      else if (isTemp) temps.push({ label: key, ...s });
      else others.push({ label: key, ...s });
    });
  }

  // Lógica de RAM Manual
  let displayName = name;
  if (allowManualRam && manualRamData) {
    displayName = `${manualRamData.marca} ${manualRamData.tamano}`;
    if (manualRamData.velocidad) {
      others.unshift({ label: 'Frecuencia (Manual)', value: manualRamData.velocidad });
    }
  }

  const needsManualEntry = allowManualRam && !manualRamData && 
    (name === 'Memory' || name === 'Memoria RAM' || name === 'Generic Memory' || name === 'Virtual Memory' || !name);

  const hasSensors = loads.length > 0 || temps.length > 0 || others.length > 0;

  const handleSaveManualRam = (e) => {
    e.preventDefault();
    if (formInput.marca) {
      localStorage.setItem('manualRamData', JSON.stringify(formInput));
      setManualRamData(formInput);
      setShowManualForm(false);
    }
  };

  const handleClearManualRam = () => {
    localStorage.removeItem('manualRamData');
    setManualRamData(null);
    setFormInput({ marca: '', tamano: '', velocidad: '' });
  };

  return (
    <div className="hw-card">
      <div className="hw-card__header">
        <div className={`hw-card__icon ${iconClass}`}>{icon}</div>
        <div className="hw-card__title-group">
          <div className="hw-card__title">{title}</div>
          {displayName && <div className="hw-card__name">{displayName}</div>}
        </div>
      </div>
      <div className="hw-card__body">
        {!hasSensors && !needsManualEntry && <div className="hw-card__empty">Sin datos disponibles</div>}
        
        <div className="sensor-list">
          {loads.map((s) => (
            <SensorBar key={s.label} label={s.label} value={s.value} />
          ))}
          {temps.map((s) => (
            <SensorRow key={s.label} label={s.label} value={s.value} colorize />
          ))}
          {others.map((s) => (
            <SensorRow key={s.label} label={s.label} value={s.value} />
          ))}
        </div>

        {allowManualRam && manualRamData && !showManualForm && (
           <button className="hw-card__manual-btn" onClick={() => setShowManualForm(true)}>
             ✏️ Editar datos de RAM
           </button>
        )}

        {needsManualEntry && !showManualForm && (
          <button className="hw-card__manual-btn" onClick={() => setShowManualForm(true)}>
            ⚠️ ¿Faltan datos de tu RAM? Ingrésalos aquí
          </button>
        )}

        {showManualForm && (
          <form className="manual-form" onSubmit={handleSaveManualRam}>
            <label>
              Marca / Modelo
              <input 
                type="text" 
                placeholder="Ej: XPG Spectrix" 
                value={formInput.marca} 
                onChange={e => setFormInput({...formInput, marca: e.target.value})}
                required
              />
            </label>
            <label>
              Capacidad y Distribución
              <input 
                type="text" 
                placeholder="Ej: 16GB (2x8GB)" 
                value={formInput.tamano} 
                onChange={e => setFormInput({...formInput, tamano: e.target.value})}
                required
              />
            </label>
            <label>
              Frecuencia / Velocidades
              <input 
                type="text" 
                placeholder="Ej: 3200 MHz" 
                value={formInput.velocidad} 
                onChange={e => setFormInput({...formInput, velocidad: e.target.value})}
              />
            </label>
            <div className="manual-form__actions">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" className="btn-secondary" onClick={() => {
                setShowManualForm(false);
                if (manualRamData) setFormInput(manualRamData);
              }}>Cancelar</button>
              {manualRamData && (
                <button type="button" className="btn-secondary" style={{color: 'var(--danger-400)', borderColor: 'var(--danger-400)'}} onClick={handleClearManualRam}>
                  Borrar
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* =========================================
   Estado desconectado
   ========================================= */
const DisconnectedView = ({ error }) => (
  <div className="mypc-disconnected animate-fade-in">
    <div className="mypc-disconnected__icon">
      <DisconnectedSvg />
    </div>
    <div>
      <h2>No se detecta LibreHardwareMonitor</h2>
      <p>
        Para ver los componentes de tu PC en tiempo real, necesitas tener 
        <strong> LibreHardwareMonitor</strong> abierto con el servidor web activado.
      </p>
    </div>

    <div className="mypc-steps">
      <div className="mypc-step">
        <span className="mypc-step__number">1</span>
        <span className="mypc-step__text">
          <strong>Descarga</strong> LibreHardwareMonitor desde su 
          página oficial de GitHub (es gratuito y open-source).
        </span>
      </div>
      <div className="mypc-step">
        <span className="mypc-step__number">2</span>
        <span className="mypc-step__text">
          <strong>Ejecuta como Administrador</strong> para que pueda acceder 
          a todos los sensores de hardware.
        </span>
      </div>
      <div className="mypc-step">
        <span className="mypc-step__number">3</span>
        <span className="mypc-step__text">
          Activa el servidor web: <strong>Options → Remote Web Server → Run</strong> (puerto 8085).
        </span>
      </div>
      <div className="mypc-step">
        <span className="mypc-step__number">4</span>
        <span className="mypc-step__text">
          <strong>Recarga esta página</strong> y tus componentes aparecerán automáticamente.
        </span>
      </div>
    </div>

    <a
      href="https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases"
      target="_blank"
      rel="noopener noreferrer"
      className="mypc-download-link"
    >
      Descargar LibreHardwareMonitor
    </a>

    {error && (
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
        Detalle: {error}
      </p>
    )}
  </div>
);

/* =========================================
   Panel de Sugerencias
   ========================================= */
const SuggestionsPanel = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="suggestions-panel">
        <div className="suggestion-card suggestion-card--success">
          <div className="suggestion-card__icon">✅</div>
          <div className="suggestion-card__content">
            <div className="suggestion-card__title">Todo funciona perfectamente</div>
            <div className="suggestion-card__message">
              Las temperaturas y el uso de los componentes están dentro de los parámetros normales.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="suggestions-panel">
      {suggestions.map((sug, idx) => (
        <div key={idx} className={`suggestion-card suggestion-card--${sug.type}`}>
          <div className="suggestion-card__icon">
            {sug.type === 'critical' ? '🚨' : '⚠️'}
          </div>
          <div className="suggestion-card__content">
            <div className="suggestion-card__title">{sug.title}</div>
            <div className="suggestion-card__message">{sug.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* =========================================
   Página principal: My PC
   ========================================= */
const MyPC = () => {
  const { data, suggestions, connected, loading, error, ultimaActualizacion } = useHardwareLocal(2000);
  const { user } = useContext(AuthContext);
  const [equipoInfo, setEquipoInfo] = useState(null);
  const hasSynced = useRef(false);

  // Sincronizar hardware silenciosamente al backend una sola vez cuando se obtienen datos
  useEffect(() => {
    if (connected && data && user && !hasSynced.current) {
      hasSynced.current = true;
      api.post('/equipos/sync-hardware', data)
        .then((res) => {
          console.log('✅ Hardware sincronizado con el servidor');
          if (res.data?.equipoSerial) {
            setEquipoInfo({
              nombre: res.data.equipoNombre,
              serial: res.data.equipoSerial
            });
          }
        })
        .catch((err) => console.warn('⚠️ No se pudo sincronizar hardware:', err.message));
    }
  }, [connected, data, user]);

  if (loading) {
    return (
      <div className="mypc-container animate-fade-in">
        <div className="mypc-header">
          <div>
            <h1>My PC</h1>
            <p>Información de hardware en tiempo real de este equipo.</p>
          </div>
        </div>
        <div className="mypc-loading">
          <div className="mypc-spinner" />
          Conectando con LibreHardwareMonitor...
        </div>
      </div>
    );
  }

  return (
    <div className="mypc-container animate-fade-in">
      <div className="mypc-header">
        <div>
          <h1>My PC</h1>
          <p>Información de hardware en tiempo real de este equipo.</p>
          {equipoInfo && (
            <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {equipoInfo.nombre || 'Equipo Asignado'} — Serial:
              </span>
              <span className="badge" style={{ background: 'var(--primary-color)', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                {equipoInfo.serial}
              </span>
            </div>
          )}
          {connected && ultimaActualizacion && (
            <span className="mypc-timestamp" style={{ display: 'block', marginTop: '4px' }}>
              Última actualización: {ultimaActualizacion.toLocaleTimeString()}
            </span>
          )}
        </div>
        <span className={`mypc-status ${connected ? 'mypc-status--online' : 'mypc-status--offline'}`}>
          <span className="mypc-status__dot" />
          {connected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {!connected ? (
        <DisconnectedView error={error} />
      ) : (
        <>
          <SuggestionsPanel suggestions={suggestions} />
          <div className="mypc-grid">
            {/* CPU */}
          <HwCard
            title="Procesador"
            name={data?.cpu?.name || 'CPU'}
            iconClass="hw-card__icon--cpu"
            icon={<CpuSvg />}
            sensors={data?.cpu?.sensors}
          />

          {/* GPU */}
          <HwCard
            title="Tarjeta Gráfica"
            name={data?.gpu?.name || 'GPU'}
            iconClass="hw-card__icon--gpu"
            icon={<GpuSvg />}
            sensors={data?.gpu?.sensors}
          />

          {/* RAM */}
          <HwCard
            title="Memoria RAM"
            name={data?.ram?.name || 'Memory'}
            iconClass="hw-card__icon--ram"
            icon={<RamSvg />}
            sensors={data?.ram?.sensors}
            allowManualRam={true}
          />

          {/* Motherboard */}
          <HwCard
            title="Placa Base"
            name={data?.motherboard?.name || 'Motherboard'}
            iconClass="hw-card__icon--motherboard"
            icon={<MotherboardSvg />}
            sensors={data?.motherboard?.sensors}
          />

          {/* Discos (uno por cada unidad) */}
          {data?.storage?.length > 0 ? (
            data.storage.map((disk, idx) => (
              <HwCard
                key={disk.name || idx}
                title="Almacenamiento"
                name={disk.name || `Disco ${idx + 1}`}
                iconClass="hw-card__icon--storage"
                icon={<DiskSvg />}
                sensors={disk.sensors}
              />
            ))
          ) : (
            <HwCard
              title="Almacenamiento"
              name="Discos"
              iconClass="hw-card__icon--storage"
              icon={<DiskSvg />}
              sensors={{}}
            />
          )}
          </div>
        </>
      )}
    </div>
  );
};

export default MyPC;
