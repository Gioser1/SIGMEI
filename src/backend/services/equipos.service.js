const EquipoModel = require('../models/equipos.model');

const obtenerTodos = async (params = {}) => {
    return await EquipoModel.findAll(params);
};

const obtenerPorId = async (id) => {
    const equipo = await EquipoModel.findById(id);
    if (!equipo) {
        const error = new Error('Equipo no encontrado');
        error.statusCode = 404;
        throw error;
    }
    return equipo;
};

const crear = async (datosEquipo) => {
    const { serial } = datosEquipo;

    // Verificar si el serial ya existe
    const existente = await EquipoModel.findBySerial(serial);
    if (existente) {
        const error = new Error('Ya existe un equipo registrado con ese serial');
        error.statusCode = 409;
        throw error;
    }

    return await EquipoModel.create(datosEquipo);
};

const actualizar = async (id, datosEquipo) => {
    // Verificar existencia del equipo
    const existente = await EquipoModel.findById(id);
    if (!existente) {
        const error = new Error('Equipo no encontrado');
        error.statusCode = 404;
        throw error;
    }

    const { serial } = datosEquipo;

    // Si viene un serial diferente, verificar duplicidad
    if (serial && serial !== existente.serial) {
        const duplicado = await EquipoModel.findBySerial(serial);
        if (duplicado) {
            const error = new Error('Ya existe un equipo registrado con ese serial');
            error.statusCode = 409;
            throw error;
        }
    }

    // Combinar datos existentes con nuevos
    const equipoDataActualizado = {
        nombre: datosEquipo.nombre !== undefined ? datosEquipo.nombre : existente.nombre,
        serial: datosEquipo.serial !== undefined ? datosEquipo.serial : existente.serial,
        marca: datosEquipo.marca !== undefined ? datosEquipo.marca : existente.marca,
        modelo: datosEquipo.modelo !== undefined ? datosEquipo.modelo : existente.modelo,
        procesador: datosEquipo.procesador !== undefined ? datosEquipo.procesador : existente.procesador,
        ram: datosEquipo.ram !== undefined ? datosEquipo.ram : existente.ram,
        almacenamiento: datosEquipo.almacenamiento !== undefined ? datosEquipo.almacenamiento : existente.almacenamiento,
        sistema_operativo: datosEquipo.sistema_operativo !== undefined ? datosEquipo.sistema_operativo : existente.sistema_operativo,
        ubicacion: datosEquipo.ubicacion !== undefined ? datosEquipo.ubicacion : existente.ubicacion,
        estado: datosEquipo.estado !== undefined ? datosEquipo.estado : existente.estado,
        fecha_compra: datosEquipo.fecha_compra !== undefined ? datosEquipo.fecha_compra : existente.fecha_compra
    };

    await EquipoModel.update(id, equipoDataActualizado);
};

const eliminar = async (id) => {
    const existente = await EquipoModel.findById(id);
    if (!existente) {
        const error = new Error('Equipo no encontrado');
        error.statusCode = 404;
        throw error;
    }

    await EquipoModel.deleteById(id);
};

module.exports = {
    obtenerTodos,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
};
