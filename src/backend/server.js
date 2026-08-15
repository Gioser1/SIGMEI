const app = require('./app');
const db = require('./config/database');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: '*', // Permitir conexiones desde cualquier frontend local
        methods: ["GET", "POST"]
    }
});

// Almacenar el io en el app para usarlo en controladores si se requiere:
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`🔌 Nuevo cliente conectado vía WebSocket: ${socket.id}`);
    
    // Escuchar el evento cuando un usuario "se une" a su sala basada en su rol o ID
    socket.on('join_room', (data) => {
        const { rol_id, usuario_id } = data;
        
        if (rol_id === 1 || rol_id === 2) {
            socket.join('tecnicos');
            console.log(`Técnico ${usuario_id} se unió a la sala 'tecnicos'`);
        } else {
            socket.join(`user_${usuario_id}`);
            console.log(`Usuario ${usuario_id} se unió a la sala 'user_${usuario_id}'`);
        }
    });

    // Cuando un usuario solicita soporte remoto
    socket.on('solicitar_soporte', (data) => {
        console.log(`📡 Solicitud de soporte de ${data.nombre} (${data.equipo_serial})`);
        
        // Reenviar a todos los técnicos como notificación
        io.to('tecnicos').emit('nueva_notificacion', {
            tipo: 'soporte',
            titulo: 'Solicitud de Soporte Remoto',
            mensaje: `${data.nombre} ha solicitado asistencia remota (${data.equipo_serial})`,
            data: data,
            timestamp: new Date().toISOString()
        });

        // También emitir como solicitud de soporte directa para el panel
        io.to('tecnicos').emit('solicitud_soporte', data);
    });

    // Cuando se crea una nueva incidencia
    socket.on('nueva_incidencia', (data) => {
        console.log(`🎫 Nueva incidencia de ${data.usuario_nombre}: ${data.titulo}`);
        
        io.to('tecnicos').emit('nueva_notificacion', {
            tipo: 'incidencia',
            titulo: 'Nueva Incidencia Reportada',
            mensaje: `${data.usuario_nombre} reportó: "${data.titulo}" — Prioridad: ${data.prioridad}`,
            data: data,
            timestamp: new Date().toISOString()
        });

        // Reenviar a la sala de técnicos para actualización inmediata de listas
        io.to('tecnicos').emit('nueva_incidencia', data);
    });

    // Unirse a la sala de chat de una incidencia
    socket.on('join_chat', (data) => {
        const { incidencia_id } = data;
        if (incidencia_id) {
            socket.join(`chat_${incidencia_id}`);
            console.log(`💬 Socket ${socket.id} se unió al chat 'chat_${incidencia_id}'`);
        }
    });

    // Notificar apertura de chat desde Técnico/Admin al Usuario
    socket.on('abrir_chat_tecnico', (data) => {
        console.log(`💬 Chat iniciado para la incidencia ${data.incidencia_id}`);
        if (data.usuario_id) {
            io.to(`user_${data.usuario_id}`).emit('abrir_chat_usuario', data);
        }
    });

    // Enviar mensaje de chat en vivo con persistencia MySQL
    socket.on('enviar_mensaje', async (data) => {
        const { incidencia_id, remitente_id, remitente_nombre, remitente_rol, mensaje, usuario_id } = data;
        if (!incidencia_id || !remitente_id || !mensaje) return;

        try {
            const [resultado] = await db.query(
                `INSERT INTO mensajes_incidencias (incidencia_id, remitente_id, mensaje)
                 VALUES (?, ?, ?)`,
                [incidencia_id, remitente_id, mensaje.trim()]
            );

            const msgObj = {
                id: resultado.insertId,
                incidencia_id,
                remitente_id,
                remitente_nombre,
                remitente_rol,
                mensaje: mensaje.trim(),
                fecha_envio: new Date().toISOString()
            };

            // Emitir a todos los participantes del chat
            io.to(`chat_${incidencia_id}`).emit('nuevo_mensaje', msgObj);

            // Si lo envía un técnico/admin, re-abrir/notificar al usuario
            if ((remitente_rol === 1 || remitente_rol === 2) && usuario_id) {
                io.to(`user_${usuario_id}`).emit('abrir_chat_usuario', { ...data, ...msgObj });
            }
            // Si lo envía un usuario, notificar a los técnicos
            else if (remitente_rol === 3) {
                io.to('tecnicos').emit('abrir_chat_tecnico_desde_usuario', { ...data, ...msgObj });
            }
        } catch (err) {
            console.error('Error guardando mensaje en WebSocket:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
});

async function autoAsignarEquiposFaltantes() {
    try {
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
            console.log(`✅ Equipo autogenerado para usuario existente ID ${u.id}: ${u.nombre} (${serial})`);
        }
    } catch (err) {
        console.warn('⚠️ No se pudo ejecutar auto-asignación inicial de equipos:', err.message);
    }
}

async function iniciarServidor() {
    try {
        const [rows] = await db.query('SHOW TABLES');
        console.log('✅ Base de datos conectada');
        
        await autoAsignarEquiposFaltantes();

        server.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
        });

    } catch (error) {
        console.error(error);
    }
}

iniciarServidor();