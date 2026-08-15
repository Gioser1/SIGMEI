const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { catchAsync } = require('../middlewares/error.middleware');
const { registrarAccion } = require('../services/auditoria.service');

// Función auxiliar para generar JWT
const generarToken = (usuario) => {
    return jwt.sign(
        {
            id: usuario.id,
            correo: usuario.correo,
            rol_id: usuario.rol_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// Registro de usuario
const registro = catchAsync(async (req, res) => {
    const { nombre, correo, password, rol_id } = req.body;

    // Verificar dominio de correo
    if (!correo.includes('@sigmei')) {
        const error = new Error('El correo debe incluir @sigmei');
        error.statusCode = 400;
        throw error;
    }

    // Verificar si el correo ya existe
    const [existente] = await db.query(
        'SELECT id FROM usuarios WHERE correo = ?',
        [correo]
    );

    if (existente.length > 0) {
        const error = new Error('Ya existe un usuario registrado con ese correo');
        error.statusCode = 409;
        throw error;
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar usuario
    const [resultado] = await db.query(
        `INSERT INTO usuarios (nombre, correo, password, rol_id)
         VALUES (?, ?, ?, ?)`,
        [nombre, correo, passwordHash, rol_id || 3]
    );

    const usuario_id = resultado.insertId;

    // Auto-asignación de Equipo al usuario
    const nombreUsuarioSanitizado = nombre.replace(/\s+/g, '').toLowerCase();
    const numeroSerial = `pc${nombreUsuarioSanitizado}${Math.floor(1000 + Math.random() * 9000)}`;

    await db.query(
        `INSERT INTO equipos (nombre, serial, estado, usuario_id) VALUES (?, ?, ?, ?)`,
        [`PC de ${nombre}`, numeroSerial, 'Activo', usuario_id]
    );

    // Generar token
    const nuevoUsuario = {
        id: usuario_id,
        correo,
        rol_id: rol_id || 3
    };

    const token = generarToken(nuevoUsuario);

    res.status(201).json({
        mensaje: 'Usuario registrado exitosamente',
        usuario: {
            id: usuario_id,
            nombre,
            correo,
            rol_id: rol_id || 3
        },
        token
    });
});

// Login de usuario
const login = catchAsync(async (req, res) => {
    const { correo, password } = req.body;

    // Buscar usuario por correo
    const [rows] = await db.query(
        'SELECT id, nombre, correo, password, rol_id FROM usuarios WHERE correo = ?',
        [correo]
    );

    if (rows.length === 0) {
        const error = new Error('Credenciales inválidas');
        error.statusCode = 401;
        throw error;
    }

    const usuario = rows[0];

    // Comparar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
        const error = new Error('Credenciales inválidas');
        error.statusCode = 401;
        throw error;
    }

    // Generar token
    const token = generarToken(usuario);

    // Registrar auditoría de login exitoso
    await registrarAccion(usuario.id, 'Login exitoso', 'auth', `El usuario ${usuario.correo} inició sesión correctamente.`);

    res.json({
        mensaje: 'Login exitoso',
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol_id: usuario.rol_id
        },
        token
    });
});

module.exports = {
    registro,
    login
};