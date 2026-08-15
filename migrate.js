const db = require('./src/backend/config/database');

async function migrate() {
    try {
        console.log('Running migration: Add usuario_id to equipos...');
        await db.query('ALTER TABLE equipos ADD COLUMN usuario_id INT NULL');
        console.log('Migration successful.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column usuario_id already exists.');
        } else {
            console.error('Migration failed:', e);
        }
    }

    try {
        console.log('Running migration: Add mesh_nodeid to equipos...');
        await db.query('ALTER TABLE equipos ADD COLUMN mesh_nodeid VARCHAR(255) NULL');
        console.log('Migration successful.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column mesh_nodeid already exists.');
        } else {
            console.error('Migration failed:', e);
        }
    }

    try {
        console.log('Running migration: Create mensajes_incidencias table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS mensajes_incidencias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                incidencia_id INT NOT NULL,
                remitente_id INT NOT NULL,
                mensaje TEXT NOT NULL,
                fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (incidencia_id) REFERENCES incidencias(id) ON DELETE CASCADE,
                FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `);
        console.log('Tabla mensajes_incidencias verificada/creada.');
    } catch (e) {
        console.error('Error creando tabla mensajes_incidencias:', e);
    }

    try {
        console.log('Verificando usuarios sin equipo asignado...');
        const [usuariosSinEquipo] = await db.query(`
            SELECT u.id, u.nombre
            FROM usuarios u
            LEFT JOIN equipos e ON u.id = e.usuario_id
            WHERE e.id IS NULL
        `);

        for (const u of usuariosSinEquipo) {
            const nombreSanitizado = (u.nombre || 'usuario').replace(/\s+/g, '').toLowerCase();
            const serial = `pc${nombreSanitizado}${Math.floor(1000 + Math.random() * 9000)}`;
            await db.query(
                `INSERT INTO equipos (nombre, serial, estado, usuario_id) VALUES (?, ?, ?, ?)`,
                [`PC de ${u.nombre}`, serial, 'Activo', u.id]
            );
            console.log(`✅ Equipo autogenerado para usuario ID ${u.id}: ${u.nombre} (Serial: ${serial})`);
        }
    } catch (e) {
        console.error('Error auto-asignando equipos en migración:', e);
    }

    process.exit();
}

migrate();