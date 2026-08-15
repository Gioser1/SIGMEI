import api from './api';

// Obtener equipos con paginación, filtros y búsqueda
export const obtenerEquipos = async (params = {}) => {
  // params puede incluir: page, limit, search, estado, etc.
  const response = await api.get('/equipos', { params });
  return response.data;
};

// Obtener un equipo por ID
export const obtenerEquipoPorId = async (id) => {
  const response = await api.get(`/equipos/${id}`);
  return response.data;
};

// Crear un nuevo equipo
export const crearEquipo = async (datos) => {
  const response = await api.post('/equipos', datos);
  return response.data;
};

// Actualizar un equipo existente
export const actualizarEquipo = async (id, datos) => {
  const response = await api.put(`/equipos/${id}`, datos);
  return response.data;
};

// Eliminar un equipo
export const eliminarEquipo = async (id) => {
  const response = await api.delete(`/equipos/${id}`);
  return response.data;
};
