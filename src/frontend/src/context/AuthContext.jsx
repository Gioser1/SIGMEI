import { createContext, useState, useEffect } from 'react';
import { login as loginService, registro as registroService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al cargar la app, si hay token pero no usuario, intentamos recuperar info del usuario
    // El login guarda el objeto usuario en localStorage, así que lo leemos para tener id, nombre, rol, etc.
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser({ token });
        }
      } else {
        setUser({ token });
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (credenciales) => {
    try {
      const data = await loginService(credenciales);
      const { token, usuario } = data; // Ajustar según respuesta real del backend
      
      setToken(token);
      setUser(usuario || { token });
      localStorage.setItem('token', token);
      
      // Si el backend devuelve info de usuario, podrías guardarla en localStorage también si es necesario
      if(usuario) {
        localStorage.setItem('user', JSON.stringify(usuario));
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error al iniciar sesión' };
    }
  };

  const register = async (datosUsuario) => {
    try {
      const data = await registroService(datosUsuario);
      const { token, usuario } = data;
      
      setToken(token);
      setUser(usuario || { token });
      localStorage.setItem('token', token);
      
      if(usuario) {
        localStorage.setItem('user', JSON.stringify(usuario));
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error al registrar' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
