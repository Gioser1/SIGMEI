import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { obtenerEquipos } from '../services/equiposService';
import './Modal.css';

const IncidenciaModal = ({ onClose, onSave, incidencia = null }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext) || {};
  const [equipos, setEquipos] = useState([]);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    equipo_id: '',
    estado: 'Abierta'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cargar equipos para el select
    const fetchEquipos = async () => {
      try {
        const res = await obtenerEquipos({ limit: 100 }); 
        const allEquipos = Array.isArray(res) ? res : res.data || [];
        
        // Si el usuario es rol 3 (usuario normal), filtrar solo sus equipos
        if (user?.rol_id === 3) {
          const misEquipos = allEquipos.filter(e => e.usuario_id === user.id);
          setEquipos(misEquipos);
          // Si solo tiene un equipo, auto-seleccionarlo
          if (misEquipos.length === 1) {
            setFormData(prev => ({ ...prev, equipo_id: misEquipos[0].id }));
          }
        } else {
          setEquipos(allEquipos);
        }
      } catch (err) {
        console.error('Error fetching equipos:', err);
      }
    };
    fetchEquipos();

    if (incidencia) {
      setFormData({
        titulo: incidencia.titulo || '',
        descripcion: incidencia.descripcion || '',
        prioridad: incidencia.prioridad || 'Media',
        equipo_id: incidencia.equipo_id || '',
        estado: incidencia.estado || 'Abierta'
      });
    }
  }, [incidencia, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dataToSubmit = {
        ...formData,
        usuario_id: user?.id
      };
      
      await onSave(dataToSubmit);

      // Emitir notificación en tiempo real a los técnicos
      if (socket && !incidencia) {
        const equipoSeleccionado = equipos.find(e => e.id === parseInt(formData.equipo_id));
        socket.emit('nueva_incidencia', {
          usuario_nombre: user?.nombre || 'Usuario',
          usuario_correo: user?.correo,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          prioridad: formData.prioridad,
          equipo_serial: equipoSeleccionado?.serial || '',
          equipo_nombre: equipoSeleccionado?.nombre || '',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar la incidencia');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{incidencia ? 'Editar Incidencia' : 'Nueva Incidencia'}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              placeholder="Ej. Falla en el disco duro"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Detalles del problema..."
              rows="3"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Equipo Afectado *</label>
              <select
                name="equipo_id"
                value={formData.equipo_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un equipo</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre} ({eq.serial})
                  </option>
                ))}
              </select>
              {user?.rol_id === 3 && equipos.length === 0 && (
                <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  No tienes un equipo asignado. Visita "My PC" primero para registrar tu equipo.
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Prioridad *</label>
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                required
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>

            {incidencia && (
              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                >
                  <option value="Abierta">Abierta</option>
                  <option value="En progreso">En progreso</option>
                  <option value="Resuelta">Resuelta</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Incidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidenciaModal;
