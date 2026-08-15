import { useState, useEffect, useRef } from 'react';

// TODO: reemplazar esta simulación por conexión real cuando el backend WebSocket esté listo.
// import { io } from 'socket.io-client';
// const socket = io(import.meta.env.VITE_API_URL);
// socket.emit('suscribir', { equipoId });
// socket.on(`snapshot:${equipoId}`, (data) => setSnapshot(data));

const generarSnapshotSimulado = () => ({
  timestamp: Date.now(),
  cpuLoad: Math.round(20 + Math.random() * 40),
  memLoad: Math.round(50 + Math.random() * 30),
  gpuClock: Math.round(700 + Math.random() * 400),
  gpuTemp: Math.round(35 + Math.random() * 25),
  cpuTemp: Math.round(40 + Math.random() * 15),
});

export const useMonitorEquipo = (equipoId, conectado = true) => {
  const [snapshot, setSnapshot] = useState(null);
  const [historial, setHistorial] = useState({ gpuClock: [], cpuTemp: [] });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!equipoId || !conectado) return;

    intervalRef.current = setInterval(() => {
      const data = generarSnapshotSimulado();
      setSnapshot(data);
      setHistorial((prev) => ({
        gpuClock: [...prev.gpuClock.slice(-29), { t: data.timestamp, v: data.gpuClock }],
        cpuTemp: [...prev.cpuTemp.slice(-29), { t: data.timestamp, v: data.cpuTemp }],
      }));
    }, 1500);

    return () => clearInterval(intervalRef.current);
  }, [equipoId, conectado]);

  return { snapshot, historial };
};