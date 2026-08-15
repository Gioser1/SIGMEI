const db = require('../config/database');

const findAll = async () => {
    const [rows] = await db.query('SELECT id, nombre, correo, rol_id FROM usuarios ORDER BY id DESC');
    return rows;
};

const findById = async (id) => {
    const [rows] = await db.query('SELECT id, nombre, correo, rol_id FROM usuarios WHERE id = ?', [id]);
    return rows[0] || null;
};

const findByCorreo = async (correo) => {
    const [rows] = await db.query('SELECT id, nombre, correo, password, rol_id FROM usuarios WHERE correo = ?', [correo]);
    return rows[0] || null;
};

const create = async (usuarioData) => {
    const { nombre, correo, passwordHash, rol_id } = usuarioData;
    const [resultado] = await db.query(
        `INSERT INTO usuarios (nombre, correo, password, rol_id)
         VALUES (?, ?, ?, ?)`,
        [nombre, correo, passwordHash, rol_id]
    );
    return resultado.insertId;
};

const update = async (id, usuarioData) => {
    const { nombre, correo, passwordHash, rol_id } = usuarioData;
    if (passwordHash) {
        await db.query(
            `UPDATE usuarios
             SET nombre = ?, correo = ?, password = ?, rol_id = ?
             WHERE id = ?`,
            [nombre, correo, passwordHash, rol_id, id]
        );
    } else {
        await db.query(
            `UPDATE usuarios
             SET nombre = ?, correo = ?, rol_id = ?
             WHERE id = ?`,
            [nombre, correo, rol_id, id]
        );
    }
};

const deleteById = async (id) => {
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
};

module.exports = {
    findAll,
    findById,
    findByCorreo,
    create,
    update,
    deleteById
};
