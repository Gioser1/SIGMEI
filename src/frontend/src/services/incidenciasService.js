import api from './api';

// Obtener incidencias con paginación, filtros y búsqueda
export const obtenerIncidencias = async (params = {}) => {
  const response = await api.get('/incidencias', { params });
  return response.data;
};

// Obtener una incidencia por ID
export const obtenerIncidenciaPorId = async (id) => {
  const response = await api.get(`/incidencias/${id}`);
  return response.data;
};

// Crear una nueva incidencia
export const crearIncidencia = async (datos) => {
  const response = await api.post('/incidencias', datos);
  return response.data;
};

// Actualizar una incidencia existente
export const actualizarIncidencia = async (id, datos) => {
  const response = await api.put(`/incidencias/${id}`, datos);
  return response.data;
};

// Eliminar una incidencia
export const eliminarIncidencia = async (id) => {
  const response = await api.delete(`/incidencias/${id}`);
  return response.data;
};
