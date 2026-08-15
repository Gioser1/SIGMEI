import { useState, useContext, useEffect } from 'react';
import './SoporteRemoto.css';
import { MonitorIcon, AlertCircleIcon } from '../components/Icons';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../services/api';

const SoporteRemoto = () => {
  const { user } = useContext(AuthContext);
  const { socket, notifications, openChat } = useContext(SocketContext) || {};
  const [equipoId, setEquipoId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
const [connectError, setConnectError] = useState('');
  
  // For users
  const [supportRequested, setSupportRequested] = useState(false);
  const [miEquipo, setMiEquipo] = useState(null);
  const [vinculando, setVinculando] = useState(false);
  const [vinculoMensaje, setVinculoMensaje] = useState('');
  const [opcionesVinculo, setOpcionesVinculo] = useState(null);

  // For technicians - active support requests
  const [solicitudesActivas, setSolicitudesActivas] = useState([]);

  // Load user's own PC info
  useEffect(() => {
    if (user?.rol_id === 3) {
      api.get('/equipos', { params: { limit: 100 } })
        .then(res => {
          const equipos = Array.isArray(res.data) ? res.data : res.data.data || [];
          const miPc = equipos.find(e => e.usuario_id === user.id);
          if (miPc) setMiEquipo(miPc);
        })
        .catch(err => console.warn('No se pudo cargar equipo:', err));
    }
  }, [user]);

  // Cargar incidencias abiertas de la base de datos para técnicos/admins
  useEffect(() => {
    if (user?.rol_id === 1 || user?.rol_id === 2) {
      api.get('/incidencias', { params: { limit: 50, estado: 'Abierta' } })
        .then(res => {
          const incidencias = Array.isArray(res.data) ? res.data : res.data.data || [];
          const list = incidencias.map(inc => ({
            id: `inc_${inc.id}`,
            incidencia_id_real: inc.id,
            usuario_id: inc.usuario_id,
            nombre: inc.usuario_nombre || 'Usuario',
            correo: inc.titulo || 'Incidencia',
            equipo_serial: inc.equipo_serial || inc.equipo_nombre || `ID Equipo: ${inc.equipo_id}`,
            serial_real: inc.equipo_serial,
            prioridad: inc.prioridad,
            titulo: inc.titulo,
            timestamp: inc.fecha_creacion || new Date().toISOString()
          }));
          setSolicitudesActivas(prev => {
            const combined = [...prev];
            list.forEach(item => {
              if (!combined.find(c => c.id === item.id || (c.titulo === item.titulo && c.nombre === item.nombre))) {
                combined.push(item);
              }
            });
            return combined;
          });
        })
        .catch(err => console.warn('Error al obtener incidencias abiertas:', err));
    }
  }, [user]);

  // Escuchar solicitudes de soporte e incidencias en tiempo real (lado del técnico)
  useEffect(() => {
    if (!socket || (user?.rol_id !== 1 && user?.rol_id !== 2)) return;

    const handleSolicitud = (data) => {
      setSolicitudesActivas(prev => {
        if (prev.find(s => s.equipo_serial === data.equipo_serial && s.nombre === data.nombre)) return prev;
        return [{ ...data, id: `sol_${Date.now()}` }, ...prev];
      });
    };

    const handleNuevaIncidencia = (data) => {
      setSolicitudesActivas(prev => {
        const item = {
          id: `inc_${Date.now()}`,
          nombre: data.usuario_nombre || 'Usuario',
          correo: data.titulo || 'Incidencia Reportada',
          equipo_serial: data.equipo_serial || data.equipo_nombre || 'Sin serial',
          titulo: data.titulo,
          prioridad: data.prioridad,
          timestamp: data.timestamp || new Date().toISOString()
        };
        if (prev.find(s => s.titulo === item.titulo && s.nombre === item.nombre)) return prev;
        return [item, ...prev];
      });
    };

    socket.on('solicitud_soporte', handleSolicitud);
    socket.on('nueva_incidencia', handleNuevaIncidencia);

    return () => {
      socket.off('solicitud_soporte', handleSolicitud);
      socket.off('nueva_incidencia', handleNuevaIncidencia);
    };
  }, [socket, user]);

const handleConnect = async (e) => {
    e.preventDefault();
    if (!equipoId.trim()) return;

    setIsConnecting(true);
    setConnectError('');

    try {
      const res = await api.get(`/soporte/conectar/${equipoId.trim()}`);
      setShareUrl(res.data.url);
      setIsConnected(true);
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'No se pudo conectar al equipo';
      setConnectError(msg);
    } finally {
      setIsConnecting(false);
    }
};

 const handleDisconnect = () => {
    setIsConnected(false);
    setEquipoId('');
    setShareUrl('');
};

  const handleRequestSupport = (e) => {
    e.preventDefault();
    setIsConnecting(true);

    // Emitir el evento a los técnicos vía WebSocket
    if (socket) {
      socket.emit('solicitar_soporte', {
        usuario_id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        equipo_serial: miEquipo?.serial || 'Sin serial',
        equipo_nombre: miEquipo?.nombre || 'Sin equipo',
        equipo_specs: {
          procesador: miEquipo?.procesador,
          ram: miEquipo?.ram,
          marca: miEquipo?.marca,
          modelo: miEquipo?.modelo,
          almacenamiento: miEquipo?.almacenamiento
        },
        timestamp: new Date().toISOString()
      });
    }

    setTimeout(() => {
      setIsConnecting(false);
      setSupportRequested(true);
    }, 1000);
  };

  const handleVincularPC = async () => {
    setVinculando(true);
    setVinculoMensaje('');
    setOpcionesVinculo(null);

    try {
      const res = await api.post('/soporte/auto-vincular');
      if (res.data.opciones) {
        setOpcionesVinculo(res.data.opciones);
        setVinculoMensaje(res.data.mensaje);
      } else {
        setVinculoMensaje(res.data.mensaje);
        const eqRes = await api.get('/equipos', { params: { limit: 100 } });
        const equipos = Array.isArray(eqRes.data) ? eqRes.data : eqRes.data.data || [];
        const miPc = equipos.find(e => e.usuario_id === user.id);
        if (miPc) setMiEquipo(miPc);
      }
    } catch (err) {
      setVinculoMensaje(err.response?.data?.mensaje || 'Error al vincular el equipo');
    } finally {
      setVinculando(false);
    }
  };

  const handleSeleccionarNodo = async (nodeid) => {
    setVinculando(true);
    try {
      const res = await api.post('/soporte/vincular-seleccion', { nodeid });
      setVinculoMensaje(res.data.mensaje);
      setOpcionesVinculo(null);
    } catch (err) {
      setVinculoMensaje(err.response?.data?.mensaje || 'Error al vincular el equipo');
    } finally {
      setVinculando(false);
    }
  };

const handleConnectToUser = async (solicitud) => {
    const targetSerial = solicitud.serial_real || solicitud.equipo_serial;
    setEquipoId(targetSerial);
    setConnectError('');
    setIsConnecting(true);

    try {
      const res = await api.get(`/soporte/conectar/${targetSerial}`);
      setShareUrl(res.data.url);
      setIsConnected(true);
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'No se pudo conectar al equipo';
      setConnectError(msg);
    } finally {
      setIsConnecting(false);
    }
};

  // If user is a normal user (rol_id 3), show the Request Support view
  if (user?.rol_id === 3) {
    return (
      <div className="soporte-remoto-container animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Soporte Remoto</h1>
          <p className="page-subtitle">Solicita ayuda a un técnico para que revise tu equipo remotamente</p>
        </div>

       {miEquipo && (
          <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.2rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <MonitorIcon size={20} style={{ color: 'var(--primary-color)' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tu equipo asignado:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{miEquipo.nombre}</strong>
              <span className="badge" style={{ background: 'var(--primary-color)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem' }}>
                {miEquipo.serial}
              </span>
              {miEquipo.procesador && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  — {miEquipo.procesador} | {miEquipo.ram || ''}
                </span>
              )}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={handleVincularPC} className="btn-secondary" disabled={vinculando}>
                {vinculando ? 'Vinculando...' : '🔗 Vincular este PC para soporte remoto'}
              </button>
              {vinculoMensaje && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{vinculoMensaje}</span>}
            </div>

            {opcionesVinculo && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Elige tu equipo:</p>
                {opcionesVinculo.map((n) => (
                  <button key={n.nodeid} className="btn-secondary" onClick={() => handleSeleccionarNodo(n.nodeid)}>
                    {n.name} — {n.ip}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="glass-panel connection-panel" style={{ textAlign: 'center' }}>
          <MonitorIcon size={64} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
          <h2>Solicitar Asistencia</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Al solicitar asistencia, un técnico podrá enviarte una solicitud para ver y controlar tu pantalla. 
            <strong> Recuerda que deberás aceptar el aviso que aparecerá en tu escritorio de Windows.</strong>
          </p>

          {!supportRequested ? (
            <button 
              onClick={handleRequestSupport} 
              className="btn-primary" 
              disabled={isConnecting}
              style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
            >
              {isConnecting ? 'Notificando a soporte...' : 'Solicitar Soporte Remoto'}
            </button>
          ) : (
            <div className="info-alert" style={{ backgroundColor: 'rgba(46, 213, 115, 0.1)', borderLeftColor: '#2ed573' }}>
              <AlertCircleIcon size={20} style={{ color: '#2ed573' }} />
              <p>Tu solicitud ha sido enviada. Por favor, mantente atento a la notificación en tu escritorio para aceptar la conexión del técnico.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Technician / Admin view
  return (
    <div className="soporte-remoto-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Soporte Remoto</h1>
        <p className="page-subtitle">Conéctate al equipo afectado para brindar asistencia</p>
      </div>

      {/* Solicitudes activas en tiempo real */}
      {solicitudesActivas.length > 0 && !isConnected && (
        <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="live-indicator"></span>
            Solicitudes de Soporte en Tiempo Real ({solicitudesActivas.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {solicitudesActivas.map((sol, idx) => (
              <div key={idx} className="soporte-ticket-card">
                <div className="ticket-info">
                  <div className="ticket-user">
                    <strong>{sol.nombre}</strong>
                    <span className="ticket-email">{sol.correo}</span>
                  </div>
                  <div className="ticket-equipo">
                    <span className="ticket-serial">{sol.equipo_serial}</span>
                    <span className="ticket-specs">
                      {sol.equipo_specs?.procesador && `${sol.equipo_specs.procesador}`}
                      {sol.equipo_specs?.ram && ` · ${sol.equipo_specs.ram}`}
                      {sol.equipo_specs?.almacenamiento && ` · ${sol.equipo_specs.almacenamiento}`}
                    </span>
                  </div>
                  <span className="ticket-time">
                    {new Date(sol.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" onClick={() => openChat(sol)} style={{ whiteSpace: 'nowrap' }}>
                    💬 Abrir Chat
                  </button>
                  <button className="btn-primary" onClick={() => handleConnectToUser(sol)} style={{ whiteSpace: 'nowrap' }}>
                    Conectar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isConnected ? (
        <div className="glass-panel connection-panel">
          <div className="panel-header">
            <h2><MonitorIcon size={24} style={{ marginRight: '10px' }} /> Nueva Conexión</h2>
          </div>
          <form onSubmit={handleConnect} className="connection-form">
            <div className="form-group">
              <label htmlFor="equipoId">ID o Serial del Equipo</label>
              <input
                type="text"
                id="equipoId"
                value={equipoId}
                onChange={(e) => setEquipoId(e.target.value)}
                placeholder="Ej. pcpepito1234"
                required
              />
            </div>
            <button type="submit" className="btn-primary connect-btn" disabled={isConnecting || !equipoId}>
              {isConnecting ? 'Estableciendo conexión...' : 'Iniciar Soporte Remoto'}
            </button>
          </form>

         
          {connectError && (
            <div className="info-alert" style={{ backgroundColor: 'rgba(255, 71, 87, 0.1)', borderLeftColor: '#ff4757' }}>
              <AlertCircleIcon size={20} style={{ color: '#ff4757' }} />
              <p>{connectError}</p>
            </div>
          )}

          <div className="info-alert">
            <AlertCircleIcon size={20} />
            <p>Al conectar, el usuario recibirá una notificación solicitando permiso para compartir su pantalla y control.</p>
          </div>
        </div>
      ) : (
        <div className="remote-session-panel animate-scale-in">
          <div className="session-header">
            <div className="session-info">
              <span className="live-indicator"></span>
              <h3>Conectado a: <strong>{equipoId}</strong></h3>
            </div>
            <button onClick={handleDisconnect} className="btn-danger disconnect-btn">
              Finalizar Sesión
            </button>
          </div>
          
          {/* Visor MeshCentral - link generado dinámicamente por el backend */}
<div className="remote-viewer-placeholder">
  {shareUrl ? (
    <iframe
      src={shareUrl}
      title={`Control Remoto MeshCentral - ${equipoId}`}
      style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
      allow="fullscreen; clipboard-read; clipboard-write"
    />
  ) : (
    <div className="viewer-content">
      <MonitorIcon size={64} className="viewer-icon" />
      <p>Conectando con <strong>{equipoId}</strong>...</p>
      <span className="loader"></span>
    </div>
  )}
</div>
        </div>
      )}
    </div>
  );
};

export default SoporteRemoto;
