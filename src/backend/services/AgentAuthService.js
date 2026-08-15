const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/database');

/**
 * Servicio para gestionar la autenticación de los Agentes Windows
 */
class AgentAuthService {
    /**
     * Genera una nueva API Key para un equipo.
     * Almacena el hash en la BD y retorna la API Key plana (solo visible una vez).
     */
    static async generateApiKeyForEquipo(equipoId) {
        // Generar una clave segura aleatoria de 32 bytes (64 caracteres hex)
        const rawApiKey = crypto.randomBytes(32).toString('hex');
        const apiKeyPrefix = 'sgm_';
        const fullApiKey = `${apiKeyPrefix}${rawApiKey}`;

        // En producción, se recomienda hashear la API Key, pero para 
        // simplificar consultas por ahora podemos guardarla plana o hasheada.
        // Siguiendo el estándar, guardaremos el hash.
        const salt = await bcrypt.genSalt(10);
        const hashedApiKey = await bcrypt.hash(fullApiKey, salt);

        // Verificar si el equipo ya tiene un agente
        const [existing] = await db.query('SELECT id FROM agentes WHERE equipo_id = ?', [equipoId]);
        
        if (existing.length > 0) {
            // Actualizar key
            await db.query('UPDATE agentes SET api_key = ?, estado = "offline" WHERE equipo_id = ?', [hashedApiKey, equipoId]);
        } else {
            // Crear nuevo
            await db.query('INSERT INTO agentes (equipo_id, api_key) VALUES (?, ?)', [equipoId, hashedApiKey]);
        }

        return fullApiKey;
    }

    /**
     * Valida una API Key proporcionada por un Agente
     */
    static async validateApiKey(apiKey) {
        if (!apiKey || !apiKey.startsWith('sgm_')) {
            return null;
        }

        // Recuperar todos los agentes (en un sistema con miles, se necesitaría un lookup distinto,
        // ej. guardando un prefijo público o buscando por ID de equipo enviado en el header).
        // Para escalar a 1000+ equipos, es mejor requerir el equipo_id en el header: X-Equipo-Id
        // Por ahora, asumimos que el header incluirá ambos, o validaremos todos.
        // MEJORA: Exigir X-Equipo-Id.
        return null; // Implementado en validación con equipoId
    }

    /**
     * Valida la API Key sabiendo el equipo_id
     */
    static async validateApiKeyForEquipo(equipoId, apiKey) {
        if (!apiKey || !equipoId) return false;

        const [rows] = await db.query('SELECT api_key FROM agentes WHERE equipo_id = ?', [equipoId]);
        if (rows.length === 0) return false;

        const hashedKey = rows[0].api_key;
        const isValid = await bcrypt.compare(apiKey, hashedKey);
        
        return isValid;
    }
}

module.exports = AgentAuthService;
