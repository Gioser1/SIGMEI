const express = require('express');
const router = express.Router();

/**
 * Parsea recursivamente el árbol JSON de LibreHardwareMonitor
 * y extrae todos los sensores en una lista plana.
 */
function flattenSensors(node, hardwareType = '', hardwareName = '', result = []) {
    // Si el nodo tiene Value, es un sensor
    if (node.Value && node.Value !== '') {
        const typeStr = (node.SensorType || '').toLowerCase();
        const textStr = (node.Text || '').toLowerCase();
        
        // --- FILTROS DE LIMPIEZA ---
        const valStr = (node.Value || '').toLowerCase();
        
        // Ignorar voltajes, corrientes y potencias pequeñas que confunden al usuario
        const isVoltage = typeStr.includes('voltage') || textStr.includes('voltage') || textStr.includes('vid') || valStr.includes(' v');
        const isCurrent = typeStr.includes('current') || textStr.includes('current') || valStr.includes(' a');
        const isPower = typeStr.includes('power') && !valStr.includes('%');
        
        // Ignorar tiempos de latencia de RAM (tAA, tRCD, tRP, etc.)
        const isTiming = typeStr.includes('time') || textStr.includes('time') || textStr.includes('latency') || valStr.includes('ns');

        // Para CPU/GPU, solo queremos Temperaturas, Cargas principales, y a lo mucho el Reloj Core (Clock).
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

    // Detectar tipo de hardware del nodo actual
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

        // Solo actualizar el nombre si estamos en un nodo principal de hardware
        if (node.Text && !hardwareName && currentHwType) {
            currentHwName = node.Text;
        }
    }

    // Recorrer hijos
    if (node.Children && Array.isArray(node.Children)) {
        for (const child of node.Children) {
            flattenSensors(child, currentHwType, currentHwName, result);
        }
    }

    return result;
}

/**
 * Organiza los sensores planos en categorías legibles.
 */
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
            // Evitar sobrescribir si ya existe y consolidar
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

/**
 * Motor de heurísticas: Analiza los datos limpios y genera sugerencias útiles.
 */
function generateSuggestions(organizedData) {
    const suggestions = [];

    // Función auxiliar para extraer números
    const parseNum = (str) => {
        if (!str) return null;
        const match = String(str).match(/([\d.]+)/);
        return match ? parseFloat(match[1]) : null;
    };

    // Analizar CPU
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
            suggestions.push({
                type: 'warning',
                title: 'CPU con alta carga',
                message: `El procesador está al ${cpuLoad.toFixed(0)}% de uso. Si sientes el PC lento, abre el Administrador de Tareas para cerrar procesos pesados en segundo plano.`
            });
        }
        
        if (maxCpuTemp > 85) {
            suggestions.push({
                type: 'critical',
                title: 'Temperatura de CPU Crítica',
                message: `El procesador alcanzó los ${maxCpuTemp}°C. Verifica que los ventiladores estén limpios y girando. Podría ser necesario aplicar nueva pasta térmica.`
            });
        } else if (maxCpuTemp > 75) {
            suggestions.push({
                type: 'warning',
                title: 'Temperatura de CPU Elevada',
                message: `El procesador está a ${maxCpuTemp}°C. Es una temperatura alta, asegúrate de que tu habitación o gabinete tenga buena ventilación.`
            });
        }
    }

    // Analizar RAM
    if (organizedData.ram?.sensors) {
        let ramLoad = 0;
        Object.entries(organizedData.ram.sensors).forEach(([key, s]) => {
            const val = parseNum(s.value);
            if (key.toLowerCase().includes('load') || key.toLowerCase().includes('memory')) {
                if (val > ramLoad) ramLoad = val;
            }
        });

        if (ramLoad > 85) {
            suggestions.push({
                type: 'warning',
                title: 'Memoria RAM casi llena',
                message: `Estás usando el ${ramLoad.toFixed(0)}% de tu RAM. Cerrar pestañas de navegador (como Chrome) o aplicaciones innecesarias mejorará mucho la fluidez del equipo.`
            });
        }
    }

    // Analizar GPU
    if (organizedData.gpu?.sensors) {
        let maxGpuTemp = 0;
        Object.entries(organizedData.gpu.sensors).forEach(([key, s]) => {
            const val = parseNum(s.value);
            if ((s.sensorType || '').toLowerCase().includes('temperature') || key.toLowerCase().includes('temp')) {
                if (val !== null && val > maxGpuTemp) maxGpuTemp = val;
            }
        });

        if (maxGpuTemp > 85) {
            suggestions.push({
                type: 'critical',
                title: 'Temperatura de Gráfica Crítica',
                message: `La GPU está a ${maxGpuTemp}°C. Si estás jugando, considera bajar la calidad gráfica o abrir la tapa del gabinete para mejorar el flujo de aire de emergencia.`
            });
        }
    }

    return suggestions;
}

/**
 * GET /api/hardware-local
 */
router.get('/', async (req, res) => {
    const host = req.query.host || 'localhost';
    const port = req.query.port || '8085';
    const url = `http://${host}:${port}/data.json`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            return res.status(502).json({
                success: false,
                connected: false,
                message: `LibreHardwareMonitor respondió con estado ${response.status}`,
            });
        }

        const rawData = await response.json();
        const sensors = flattenSensors(rawData);
        const organized = organizeSensors(sensors);
        const suggestions = generateSuggestions(organized);

        res.json({
            success: true,
            connected: true,
            timestamp: new Date().toISOString(),
            data: organized,
            suggestions: suggestions
        });
    } catch (error) {
        const isAbort = error.name === 'AbortError';
        res.status(503).json({
            success: false,
            connected: false,
            message: isAbort
                ? 'LibreHardwareMonitor no respondió (timeout de 3s). ¿Está abierto con el servidor web activo?'
                : `No se pudo conectar a LibreHardwareMonitor: ${error.message}`,
        });
    }
});

module.exports = router;
