const { execFile } = require('child_process');
const WebSocket = require('ws');
const path = require('path');

const MESH_URL = 'wss://69a4-181-140-224-120.ngrok-free.app';
const MESH_USER = '~t:Hr5zp67BSddXExNB';
const MESH_PASS = 'j04l35McyKPlEu73AhrF';
const MESHCTRL_PATH = path.join(__dirname, '../../../node_modules/meshcentral/meshctrl.js');

// Lista todos los dispositivos conectados (crudo, tal como los ve MeshCentral)
function listNodes() {
    return new Promise((resolve, reject) => {
        const url = `${MESH_URL.replace('wss', 'wss')}/control.ashx?user=${encodeURIComponent(MESH_USER)}&pass=${encodeURIComponent(MESH_PASS)}`;
        const ws = new WebSocket(url, { rejectUnauthorized: false });
        const timeout = setTimeout(() => { ws.close(); reject(new Error('Timeout esperando respuesta de MeshCentral')); }, 8000);

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.action === 'nodes') {
                clearTimeout(timeout);
                ws.close();
                // Aplanar: viene agrupado por meshid, lo convertimos en una lista simple
                const flat = [];
                Object.values(msg.nodes || {}).forEach(group => {
                    group.forEach(n => flat.push({ nodeid: n._id, name: n.name, ip: n.ip, conn: n.conn }));
                });
                resolve(flat);
            }
        });

        ws.on('open', () => ws.send(JSON.stringify({ action: 'nodes' })));
        ws.on('error', (err) => { clearTimeout(timeout); reject(err); });
    });
}

// Genera un link de sharing temporal para un nodeid específico
function generateShareLink(nodeid, guestName = 'tecnico-sigmei', durationMin = 60) {
    return new Promise((resolve, reject) => {
        execFile('node', [
            MESHCTRL_PATH, 'DeviceSharing',
            '--url', MESH_URL,
            '--loginuser', MESH_USER,
            '--loginpass', MESH_PASS,
            '--id', nodeid,
            '--add', guestName,
            '--type', 'desktop',
            '--consent', 'notify',
            '--duration', String(durationMin)
        ], (error, stdout, stderr) => {
            if (error) return reject(new Error(stderr || error.message));
            // El stdout trae "ID: xxx\nURL: https://..."
            const match = stdout.match(/URL:\s*(\S+)/);
            if (!match) return reject(new Error('No se pudo extraer la URL del resultado: ' + stdout));
            resolve(match[1]);
        });
    });
}

module.exports = { listNodes, generateShareLink };