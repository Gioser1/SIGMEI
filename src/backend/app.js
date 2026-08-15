const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Documentación de la API (Pública)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas públicas
app.use('/api/auth', require('./routes/auth.routes'));

// Rutas protegidas
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/equipos', require('./routes/equipos.routes'));
app.use('/api/incidencias', require('./routes/incidencias.routes'));
app.use('/api/incidencias', require('./routes/mensajes.routes'));
app.use('/api/mantenimientos', require('./routes/mantenimientos.routes'));
app.use('/api/metricas', require('./routes/metricas.routes'));
app.use('/api/alertas', require('./routes/alertas.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/auditoria', require('./routes/auditoria.routes'));
app.use('/api/agentes', require('./routes/agentes.routes'));
app.use('/api/hardware-local', require('./routes/hardware-local.routes'));
app.use('/api/soporte', require('./routes/soporte.routes'));

// Middleware de manejo de errores global (debe ser el último en registrarse)
app.use(errorHandler);

module.exports = app;