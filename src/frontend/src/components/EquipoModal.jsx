import { useState, useEffect } from 'react';
import './EquipoModal.css';

const EquipoModal = ({ isOpen, onClose, onSave, equipoBase }) => {
const initialState = {
    nombre: '',
    marca: '',
    modelo: '',
    serial: '',
    estado: 'Activo'
};
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (equipoBase) {
      setFormData(equipoBase);
    } else {
      setFormData(initialState);
    }
  }, [equipoBase, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>{equipoBase ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nombre del Equipo</label>
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Marca</label>
            <input 
              type="text" 
              name="marca" 
              value={formData.marca} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Modelo</label>
            <input 
              type="text" 
              name="modelo" 
              value={formData.modelo} 
              onChange={handleChange} 
            />
          </div>
         <div className="form-group">
  <label>Número de Serie</label>
  <input 
    type="text" 
    name="serial" 
    value={formData.serial} 
    onChange={handleChange} 
  />
</div>
          <div className="form-group">
            <label>Estado</label>
           <select name="estado" value={formData.estado} onChange={handleChange}>
  <option value="Activo">Activo</option>
  <option value="Inactivo">Inactivo</option>
  <option value="En Mantenimiento">En Mantenimiento</option>
  <option value="De Baja">De Baja</option>
</select>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipoModal;
