const UsuarioService = require('../services/usuarios.service');
const { catchAsync } = require('../middlewares/error.middleware');
const { registrarAccion } = require('../services/auditoria.service');

// Obtener todos los usuarios
const getUsuarios = catchAsync(async (req, res) => {
    const usuarios = await UsuarioService.obtenerTodos();
    res.json(usuarios);
});

// Obtener usuario por ID
const getUsuarioById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const usuario = await UsuarioService.obtenerPorId(id);
    res.json(usuario);
});

// Crear usuario (con hash bcrypt y log de auditoría)
const crearUsuario = catchAsync(async (req, res) => {
    const { nombre, correo, password, rol_id } = req.body;
    
    const id = await UsuarioService.crear({
        nombre,
        correo,
        password,
        rol_id
    });

    // Registrar en auditoría
    await registrarAccion(
        req.usuario.id,
        'Creación de usuario',
        'usuarios',
        `Se creó el usuario "${nombre}" con correo "${correo}" (ID: ${id})`
    );

    res.status(201).json({
        mensaje: 'Usuario creado',
        id
    });
});

// Actualizar usuario (con hash bcrypt si se envía password)
const actualizarUsuario = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { nombre, correo, password, rol_id } = req.body;

    await UsuarioService.actualizar(id, {
        nombre,
        correo,
        password,
        rol_id
    });

    res.json({
        mensaje: 'Usuario actualizado'
    });
});

// Eliminar usuario (con log de auditoría)
const eliminarUsuario = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Obtener los datos del usuario antes de eliminarlo para la descripción de la auditoría
    const usuario = await UsuarioService.obtenerPorId(id);

    await UsuarioService.eliminar(id);

    // Registrar en auditoría
    await registrarAccion(
        req.usuario.id,
        'Eliminación de usuario',
        'usuarios',
        `Se eliminó el usuario "${usuario.nombre}" con correo "${usuario.correo}" (ID: ${id})`
    );

    res.json({
        mensaje: 'Usuario eliminado'
    });
});

module.exports = {
    getUsuarios,
    getUsuarioById,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};