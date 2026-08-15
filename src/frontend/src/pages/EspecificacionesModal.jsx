import { useState, useEffect } from 'react';
import { obtenerEspecificacionesEquipo, diagnosticarProblema } from '../services/equiposService';
import './EspecificacionesModal.css';

const EspecificacionesModal = ({ isOpen, onClose, equipos }) => {
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  const [tab, setTab] = useState('specs'); // 'specs' | 'problema'
  const [specs, setSpecs] = useState(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  const [form, setForm] = useState({ componente: 'CPU', descripcion: '' });
  const [diagnostico, setDiagnostico] = useState(null);
  const [diagnosticando, setDiagnosticando] = useState(false);
  const [errorDiagnostico, setErrorDiagnostico] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      // reset al cerrar
      setEquipoSeleccionado('');
      setSpecs(null);
      setDiagnostico(null);
      setErrorDiagnostico(null);
      setTab('specs');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!equipoSeleccionado) return;
    const cargarSpecs = async () => {
      setLoadingSpecs(true);
      try {
        const data = await obtenerEspecificacionesEquipo(equipoSeleccionado);
        setSpecs(data);
      } catch (err) {
        console.error('Error al cargar especificaciones', err);
        setSpecs(null);
      } finally {
        setLoadingSpecs(false);
      }
    };
    cargarSpecs();
  }, [equipoSeleccionado]);

  const handleBuscarSolucion = async (e) => {
    e.preventDefault();
    if (!form.descripcion.trim()) return;

    setDiagnosticando(true);
    setErrorDiagnostico(null);
    setDiagnostico(null);
    try {
      const resultado = await diagnosticarProblema(equipoSeleccionado, {
        componente: form.componente,
        descripcion: form.descripcion,
      });
      setDiagnostico(resultado);
    } catch (err) {
      console.error('Error al diagnosticar', err);
      setErrorDiagnostico('No se pudo generar el diagnóstico. Intenta de nuevo.');
    } finally {
      setDiagnosticando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content specs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Especificaciones y Diagnóstico</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="specs-modal__equipo-select">
          <label htmlFor="equipo-select">Equipo</label>
          <select
            id="equipo-select"
            value={equipoSeleccionado}
            onChange={(e) => setEquipoSeleccionado(e.target.value)}
          >
            <option value="">Selecciona un equipo...</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nombre} — {eq.marca} {eq.modelo}
              </option>
            ))}
          </select>
        </div>

        {equipoSeleccionado && (
          <>
            <div className="specs-modal__tabs">
              <button
                className={`specs-tab ${tab === 'specs' ? 'active' : ''}`}
                onClick={() => setTab('specs')}
              >
                Especificaciones
              </button>
              <button
                className={`specs-tab ${tab === 'problema' ? 'active' : ''}`}
                onClick={() => setTab('problema')}
              >
                Reportar Problema
              </button>
            </div>

            <div className="specs-modal__body">
              {tab === 'specs' && (
                <>
                  {loadingSpecs && <p className="specs-loading">Cargando especificaciones...</p>}
                  {!loadingSpecs && specs && (
                    <div className="specs-grid">
                      <SpecCard titulo="Procesador (CPU)" datos={specs.cpu} />
                      <SpecCard titulo="Tarjeta Gráfica (GPU)" datos={specs.gpu} />
                      <SpecCard titulo="Memoria RAM" datos={specs.ram} />
                      <SpecCard titulo="Almacenamiento" datos={specs.disco} />
                    </div>
                  )}
                  {!loadingSpecs && !specs && (
                    <p className="specs-empty">No hay datos de especificaciones para este equipo todavía.</p>
                  )}
                </>
              )}

              {tab === 'problema' && (
                <div className="problema-section">
                  <form className="problema-form" onSubmit={handleBuscarSolucion}>
                    <label>
                      Componente afectado
                      <select
                        value={form.componente}
                        onChange={(e) => setForm({ ...form, componente: e.target.value })}
                      >
                        <option value="CPU">CPU / Procesador</option>
                        <option value="GPU">GPU / Tarjeta gráfica</option>
                        <option value="RAM">Memoria RAM</option>
                        <option value="Disco">Disco / Almacenamiento</option>
                        <option value="Red">Red / Conectividad</option>
                        <option value="Software">Sistema Operativo / Software</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </label>

                    <label>
                      Descripción del problema
                      <textarea
                        rows={4}
                        placeholder="Ej: El equipo se reinicia solo cuando abro juegos o programas exigentes, la pantalla se pone azul..."
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                      />
                    </label>

                    <button type="submit" className="btn-primary" disabled={diagnosticando}>
                      {diagnosticando ? 'Analizando...' : 'Buscar Solución'}
                    </button>
                  </form>

                  {errorDiagnostico && <p className="diagnostico-error">{errorDiagnostico}</p>}

                  {diagnostico && (
                    <div className="diagnostico-resultado">
                      <h4>Diagnóstico sugerido</h4>
                      <p className="diagnostico-causa"><strong>Posible causa:</strong> {diagnostico.causa_probable}</p>
                      <h5>Pasos recomendados</h5>
                      <ol>
                        {diagnostico.pasos_solucion?.map((paso, i) => (
                          <li key={i}>{paso}</li>
                        ))}
                      </ol>
                      {diagnostico.nivel_urgencia && (
                        <span className={`urgencia-badge urgencia-${diagnostico.nivel_urgencia}`}>
                          Urgencia: {diagnostico.nivel_urgencia}
                        </span>
                      )}
                      <p className="diagnostico-disclaimer">
                        Este diagnóstico es una sugerencia generada por IA basada en la descripción proporcionada. 
                        Verifica siempre con una revisión técnica presencial antes de reemplazar componentes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SpecCard = ({ titulo, datos }) => {
  if (!datos) return null;
  return (
    <div className="spec-card">
      <h4>{titulo}</h4>
      <ul>
        {Object.entries(datos).map(([clave, valor]) => (
          <li key={clave}>
            <span className="spec-label">{clave}</span>
            <span className="spec-value">{valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EspecificacionesModal;