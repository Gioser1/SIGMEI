import api from './api';

export const obtenerResumenDashboard = async () => {
  const response = await api.get('/dashboard/resumen');
  return response.data;
};
