import api from './api';

export const login = async (credenciales) => {
  const response = await api.post('/auth/login', credenciales);
  return response.data;
};

// Si tuvieras más endpoints como registro, irían aquí
export const registro = async (datosUsuario) => {
  const response = await api.post('/auth/registro', datosUsuario);
  return response.data;
};
