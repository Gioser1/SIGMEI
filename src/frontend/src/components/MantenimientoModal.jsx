import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { obtenerEquipos } from '../services/equiposService';
import './Modal.css';

const MantenimientoModal = ({ onClose, onSave, mantenimiento = null }) => {
  const { user } = useContext(AuthContext);
  const [equipos, setEquipos] = useState([]);
  const [formData, setFormData] = useState({
    tipo: 'preventivo',
    descripcion: '',
    equipo_id: '',
    fecha: '',
    estado: 'pendiente'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const res = await obtenerEquipos({ limit: 100 });
        setEquipos(Array.isArray(res) ? res : res.data || []);
      } catch (err) {
        console.error('Error fetching equipos:', err);
      }
    };
    fetchEquipos();

    if (mantenimiento) {
      setFormData({
        tipo: mantenimiento.tipo || 'preventivo',
        descripcion: mantenimiento.descripcion || '',
        equipo_id: mantenimiento.equipo_id || '',
        fecha: mantenimiento.fecha
          ? mantenimiento.fecha.substring(0, 10)
          : '',
        estado: mantenimiento.estado || 'pendiente'
      });
    }
  }, [mantenimiento]);

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
        tecnico_id: user?.id
      };

      await onSave(dataToSubmit);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar el mantenimiento');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{mantenimiento ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Equipo *</label>
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
            </div>

            <div className="form-group">
              <label>Tipo *</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
              >
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descripción *</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              required
              placeholder="Descripción del mantenimiento a realizar..."
              rows="3"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
            </div>

            {mantenimiento && (
              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Mantenimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MantenimientoModal;
