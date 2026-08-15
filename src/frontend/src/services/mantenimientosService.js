import api from './api';

// Obtener mantenimientos con paginación, filtros y búsqueda
export const obtenerMantenimientos = async (params = {}) => {
  const response = await api.get('/mantenimientos', { params });
  return response.data;
};

// Obtener un mantenimiento por ID
export const obtenerMantenimientoPorId = async (id) => {
  const response = await api.get(`/mantenimientos/${id}`);
  return response.data;
};

// Crear un nuevo mantenimiento
export const crearMantenimiento = async (datos) => {
  const response = await api.post('/mantenimientos', datos);
  return response.data;
};

// Actualizar un mantenimiento existente
export const actualizarMantenimiento = async (id, datos) => {
  const response = await api.put(`/mantenimientos/${id}`, datos);
  return response.data;
};

// Eliminar un mantenimiento
export const eliminarMantenimiento = async (id) => {
  const response = await api.delete(`/mantenimientos/${id}`);
  return response.data;
};
