const MeshCtrl = require('meshcentral/meshctrl.js');

async function testConnection() {
  const conn = await MeshCtrl.CreateMeshCentralConnection(
    'wss://localhost:4430',   // URL de tu MeshCentral local
    {
      user: '~t:Hr5zp67BSddXExNB',
      pass: 'j04l35McyKPlEu73AhrF',
    },
    null,
    (msg) => console.log('LOG:', msg),
    (data) => console.log('SERVER INFO:', data)
  );

  conn.on('connect', () => {
    console.log('✅ Conectado a MeshCentral');
    conn.ListDevices({}, (err, devices) => {
      console.log('Dispositivos:', devices);
      conn.Close();
    });
  });

  conn.on('close', () => console.log('Conexión cerrada'));
  conn.on('error', (err) => console.error('❌ Error:', err));
}

testConnection();