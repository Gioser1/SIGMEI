import { useState, useEffect, useRef, useCallback } from 'react';
import api from './api';

/**
 * Obtiene los datos de hardware del PC local via el proxy del backend.
 */
export const obtenerHardwareLocal = async () => {
  const response = await api.get('/hardware-local');
  return response.data;
};

/**
 * Hook que hace polling cada `intervaloMs` al endpoint de hardware local.
 * Devuelve { data, connected, loading, error, ultimaActualizacion }.
 */
export const useHardwareLocal = (intervaloMs = 2000) => {
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await obtenerHardwareLocal();
      if (!mountedRef.current) return;

      if (result.success) {
        setData(result.data);
        setSuggestions(result.suggestions || []);
        setConnected(true);
        setError(null);
        setUltimaActualizacion(new Date());
      } else {
        setConnected(false);
        setError(result.message || 'Error desconocido');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setConnected(false);
      setError(
        err.response?.data?.message ||
        'No se pudo conectar con el servidor. ¿Está corriendo LibreHardwareMonitor?'
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData(); // Primera petición inmediata

    intervalRef.current = setInterval(fetchData, intervaloMs);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchData, intervaloMs]);

  return { data, suggestions, connected, loading, error, ultimaActualizacion };
};
