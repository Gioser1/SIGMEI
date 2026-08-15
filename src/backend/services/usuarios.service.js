const bcrypt = require('bcrypt');
const UsuarioModel = require('../models/usuarios.model');

const obtenerTodos = async () => {
    return await UsuarioModel.findAll();
};

const obtenerPorId = async (id) => {
    const usuario = await UsuarioModel.findById(id);
    if (!usuario) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
    }
    return usuario;
};

const crear = async (datosUsuario) => {
    const { nombre, correo, password, rol_id } = datosUsuario;

    // Verificar si el correo ya existe
    const existente = await UsuarioModel.findByCorreo(correo);
    if (existente) {
        const error = new Error('Ya existe un usuario con ese correo');
        error.statusCode = 409;
        throw error;
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertId = await UsuarioModel.create({
        nombre,
        correo,
        passwordHash,
        rol_id
    });

    return insertId;
};

const actualizar = async (id, datosUsuario) => {
    const { nombre, correo, password, rol_id } = datosUsuario;

    // Verificar existencia del usuario
    const existente = await UsuarioModel.findById(id);
    if (!existente) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
    }

    // Si viene un correo diferente, verificar duplicidad
    if (correo && correo !== existente.correo) {
        const duplicado = await UsuarioModel.findByCorreo(correo);
        if (duplicado) {
            const error = new Error('Ya existe un usuario con ese correo');
            error.statusCode = 409;
            throw error;
        }
    }

    let passwordHash = null;
    if (password) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
    }

    // Ejecutar actualización
    await UsuarioModel.update(id, {
        nombre: nombre !== undefined ? nombre : existente.nombre,
        correo: correo !== undefined ? correo : existente.correo,
        passwordHash,
        rol_id: rol_id !== undefined ? rol_id : existente.rol_id
    });
};

const eliminar = async (id) => {
    const existente = await UsuarioModel.findById(id);
    if (!existente) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
    }

    await UsuarioModel.deleteById(id);
};

module.exports = {
    obtenerTodos,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
};
