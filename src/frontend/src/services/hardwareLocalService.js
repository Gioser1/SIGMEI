import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Obtiene los datos de hardware DIRECTAMENTE desde el navegador del usuario,
 * conectándose al LibreHardwareMonitor local de SU PC (localhost:8085).
 *
 * Esto es necesario porque si el backend está en un servidor remoto,
 * leer desde el backend devolvería el hardware del servidor, no del usuario.
 */

/* =========================================
   Parseo del JSON de LibreHardwareMonitor
   ========================================= */

function flattenSensors(node, hardwareType = '', hardwareName = '', result = []) {
  if (node.Value && node.Value !== '') {
    const typeStr = (node.SensorType || '').toLowerCase();
    const textStr = (node.Text || '').toLowerCase();
    const valStr = (node.Value || '').toLowerCase();

    const isVoltage = typeStr.includes('voltage') || textStr.includes('voltage') || textStr.includes('vid') || valStr.includes(' v');
    const isCurrent = typeStr.includes('current') || textStr.includes('current') || valStr.includes(' a');
    const isPower = typeStr.includes('power') && !valStr.includes('%');
    const isTiming = typeStr.includes('time') || textStr.includes('time') || textStr.includes('latency') || valStr.includes('ns');
    const isMinorClock = hardwareType !== 'RAM' && typeStr.includes('clock') && (textStr.includes('bus') || textStr.includes('memory') || textStr.includes('shader'));

    if (!isVoltage && !isCurrent && !isPower && !isTiming && !isMinorClock) {
      result.push({
        id: node.id || '',
        text: node.Text || '',
        value: node.Value,
        min: node.Min || '',
        max: node.Max || '',
        sensorType: node.SensorType || '',
        hardwareType,
        hardwareName,
      });
    }
  }

  let currentHwType = hardwareType;
  let currentHwName = hardwareName;
  if (node.ImageURL) {
    const img = (node.ImageURL || '').toLowerCase();
    if (img.includes('cpu')) currentHwType = 'CPU';
    else if (img.includes('nvidia') || img.includes('ati') || img.includes('amd') || img.includes('gpu')) currentHwType = 'GPU';
    else if (img.includes('ram') || img.includes('memory')) currentHwType = 'RAM';
    else if (img.includes('hdd') || img.includes('ssd') || img.includes('storage') || img.includes('disk')) currentHwType = 'Storage';
    else if (img.includes('mainboard') || img.includes('motherboard')) currentHwType = 'Motherboard';
    else if (img.includes('fan')) currentHwType = 'Fans';
    else if (img.includes('battery')) currentHwType = 'Battery';

    if (node.Text && !hardwareName && currentHwType) {
      currentHwName = node.Text;
    }
  }

  if (node.Children && Array.isArray(node.Children)) {
    for (const child of node.Children) {
      flattenSensors(child, currentHwType, currentHwName, result);
    }
  }

  return result;
}

function organizeSensors(sensors) {
  const categories = {
    cpu: { name: '', sensors: {} },
    gpu: { name: '', sensors: {} },
    ram: { name: 'Memoria RAM', sensors: {} },
    storage: [],
    motherboard: { name: '', sensors: {} },
  };

  for (const s of sensors) {
    const type = s.hardwareType;
    const text = s.text;
    const val = s.value;

    if (type === 'CPU') {
      if (!categories.cpu.name) categories.cpu.name = s.hardwareName;
      categories.cpu.sensors[text] = { value: val, min: s.min, max: s.max, sensorType: s.sensorType };
    } else if (type === 'GPU') {
      if (!categories.gpu.name) categories.gpu.name = s.hardwareName;
      categories.gpu.sensors[text] = { value: val, min: s.min, max: s.max, sensorType: s.sensorType };
    } else if (type === 'RAM') {
      if (!categories.ram.name || categories.ram.name === 'Memoria RAM') categories.ram.name = s.hardwareName || 'Memoria RAM';
      categories.ram.sensors[text] = { value: val, min: s.min, max: s.max, sensorType: s.sensorType };
    } else if (type === 'Storage') {
      let disk = categories.storage.find(d => d.name === s.hardwareName);
      if (!disk) {
        disk = { name: s.hardwareName, sensors: {} };
        categories.storage.push(disk);
      }
      disk.sensors[text] = { value: val, min: s.min, max: s.max, sensorType: s.sensorType };
    } else if (type === 'Motherboard') {
      if (!categories.motherboard.name) categories.motherboard.name = s.hardwareName;
      categories.motherboard.sensors[text] = { value: val, min: s.min, max: s.max, sensorType: s.sensorType };
    }
  }

  return categories;
}

function generateSuggestions(organizedData) {
  const suggestions = [];
  const parseNum = (str) => {
    if (!str) return null;
    const match = String(str).match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  };

  // CPU
  if (organizedData.cpu?.sensors) {
    let maxCpuTemp = 0;
    let cpuLoad = 0;
    Object.entries(organizedData.cpu.sensors).forEach(([key, s]) => {
      const val = parseNum(s.value);
      if (val === null) return;
      if (key.toLowerCase().includes('load') || key.toLowerCase().includes('total')) {
        if (val > cpuLoad) cpuLoad = val;
      }
      if ((s.sensorType || '').toLowerCase().includes('temperature') || key.toLowerCase().includes('temp')) {
        if (val > maxCpuTemp) maxCpuTemp = val;
      }
    });
    if (cpuLoad > 85) {
      suggestions.push({ type: 'warning', title: 'CPU con alta carga', message: `El procesador está al ${cpuLoad.toFixed(0)}% de uso. Cierra procesos pesados en segundo plano.` });
    }
    if (maxCpuTemp > 85) {
      suggestions.push({ type: 'critical', title: 'Temperatura de CPU Crítica', message: `El procesador alcanzó los ${maxCpuTemp}°C. Verifica ventiladores y pasta térmica.` });
    } else if (maxCpuTemp > 75) {
      suggestions.push({ type: 'warning', title: 'Temperatura de CPU Elevada', message: `El procesador está a ${maxCpuTemp}°C. Asegura buena ventilación.` });
    }
  }

  // RAM
  if (organizedData.ram?.sensors) {
    let ramLoad = 0;
    Object.entries(organizedData.ram.sensors).forEach(([key, s]) => {
      const val = parseNum(s.value);
      if (key.toLowerCase().includes('load') || key.toLowerCase().includes('memory')) {
        if (val > ramLoad) ramLoad = val;
      }
    });
    if (ramLoad > 85) {
      suggestions.push({ type: 'warning', title: 'Memoria RAM casi llena', message: `Estás usando el ${ramLoad.toFixed(0)}% de tu RAM. Cierra pestañas o aplicaciones innecesarias.` });
    }
  }

  // GPU
  if (organizedData.gpu?.sensors) {
    let maxGpuTemp = 0;
    Object.entries(organizedData.gpu.sensors).forEach(([key, s]) => {
      const val = parseNum(s.value);
      if ((s.sensorType || '').toLowerCase().includes('temperature') || key.toLowerCase().includes('temp')) {
        if (val !== null && val > maxGpuTemp) maxGpuTemp = val;
      }
    });
    if (maxGpuTemp > 85) {
      suggestions.push({ type: 'critical', title: 'Temperatura de Gráfica Crítica', message: `La GPU está a ${maxGpuTemp}°C. Baja la calidad gráfica o mejora la ventilación.` });
    }
  }

  return suggestions;
}

/* =========================================
   Fetch directo al LibreHardwareMonitor LOCAL del usuario
   ========================================= */

export const obtenerHardwareLocal = async () => {
  // Se conecta directamente al LibreHardwareMonitor del navegador del usuario
  const url = 'http://localhost:8085/data.json';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        connected: false,
        message: `LibreHardwareMonitor respondió con estado ${response.status}`,
      };
    }

    const rawData = await response.json();
    const sensors = flattenSensors(rawData);
    const organized = organizeSensors(sensors);
    const suggestions = generateSuggestions(organized);

    return {
      success: true,
      connected: true,
      timestamp: new Date().toISOString(),
      data: organized,
      suggestions,
    };
  } catch (error) {
    clearTimeout(timeout);
    const isAbort = error.name === 'AbortError';
    return {
      success: false,
      connected: false,
      message: isAbort
        ? 'LibreHardwareMonitor no respondió (timeout de 3s). ¿Está abierto con el servidor web activo?'
        : `No se pudo conectar a LibreHardwareMonitor: ${error.message}`,
    };
  }
};

/**
 * Hook que hace polling cada `intervaloMs` al LibreHardwareMonitor LOCAL del usuario.
 * Devuelve { data, suggestions, connected, loading, error, ultimaActualizacion }.
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
      setError('No se pudo conectar con LibreHardwareMonitor. ¿Está abierto?');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    intervalRef.current = setInterval(fetchData, intervaloMs);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchData, intervaloMs]);

  return { data, suggestions, connected, loading, error, ultimaActualizacion };
};
