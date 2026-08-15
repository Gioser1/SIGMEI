import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import {
  obtenerIncidencias,
  crearIncidencia,
  actualizarIncidencia,
  eliminarIncidencia
} from '../services/incidenciasService';
import DataTable from '../components/DataTable';
import IncidenciaModal from '../components/IncidenciaModal';
import './Incidencias.css';

const Incidencias = () => {
  const { user } = useContext(AuthContext);
  const { socket, openChat } = useContext(SocketContext) || {};
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginación y búsqueda
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incidenciaEditando, setIncidenciaEditando] = useState(null);

  const fetchIncidencias = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, q: search };
      if (user?.rol_id === 3) {
        params.usuario_id = user.id;
      }
      const data = await obtenerIncidencias(params);
      if (Array.isArray(data)) {
        setIncidencias(data);
        setTotalPages(1);
      } else {
        setIncidencias(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error al obtener incidencias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidencias();
  }, [page, search, user]);

  // Escuchar incidencias creadas en tiempo real vía WebSocket
  useEffect(() => {
    if (!socket) return;
    const handleNuevaIncidencia = () => {
      console.log('🔄 Actualizando lista de incidencias en tiempo real...');
      fetchIncidencias();
    };
    socket.on('nueva_incidencia', handleNuevaIncidencia);
    return () => socket.off('nueva_incidencia', handleNuevaIncidencia);
  }, [socket, page, search, user]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openNewModal = () => {
    setIncidenciaEditando(null);
    setIsModalOpen(true);
  };

  const openEditModal = (incidencia) => {
    setIncidenciaEditando(incidencia);
    setIsModalOpen(true);
  };

  const handleDelete = async (incidencia) => {
    if (window.confirm(`¿Estás seguro de eliminar la incidencia: "${incidencia.titulo}"?`)) {
      try {
        await eliminarIncidencia(incidencia.id);
        fetchIncidencias();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('No se pudo eliminar la incidencia.');
      }
    }
  };

  const handleSaveModal = async (formData) => {
    if (incidenciaEditando) {
      await actualizarIncidencia(incidenciaEditando.id, formData);
    } else {
      await crearIncidencia(formData);
    }
    setIsModalOpen(false);
    setIncidenciaEditando(null);
    fetchIncidencias();
  };

  // Helper para normalizar texto para clase CSS
  const normalizeClass = (text) => {
    if (!text) return '';
    return text.toLowerCase().replace(/\s+/g, '-');
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Título', accessor: 'titulo' },
    {
      header: 'Equipo',
      accessor: 'equipo_nombre',
      render: (row) => row.equipo_nombre || `ID: ${row.equipo_id}`
    },
    {
      header: 'Prioridad',
      accessor: 'prioridad',
      render: (row) => (
        <span className={`badge prioridad-${normalizeClass(row.prioridad)}`}>
          {row.prioridad}
        </span>
      )
    },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (row) => (
        <span className={`badge estado-${normalizeClass(row.estado)}`}>
          {row.estado}
        </span>
      )
    },
    {
      header: 'Fecha',
      accessor: 'fecha_creacion',
      render: (row) => {
        if (!row.fecha_creacion) return '—';
        return new Date(row.fecha_creacion).toLocaleDateString('es-VE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    },
    {
      header: 'Chat',
      accessor: 'chat',
      render: (row) => (
        <button
          className="btn-secondary"
          style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
          onClick={() => openChat(row)}
        >
          💬 Abrir Chat
        </button>
      )
    }
  ];

  return (
    <div className="incidencias-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Gestión de Incidencias</h1>
          <p>Reporta y gestiona las incidencias de los equipos.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          + Nueva Incidencia
        </button>
      </div>

      <div className="table-controls">
        <input
          type="text"
          placeholder="Buscar incidencia..."
          value={search}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      <DataTable
        columns={columns}
        data={incidencias}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn-secondary"
        >
          Anterior
        </button>
        <span style={{ color: 'hsl(var(--text-secondary))' }}>
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="btn-secondary"
        >
          Siguiente
        </button>
      </div>

      {isModalOpen && (
        <IncidenciaModal
          onClose={() => {
            setIsModalOpen(false);
            setIncidenciaEditando(null);
          }}
          onSave={handleSaveModal}
          incidencia={incidenciaEditando}
        />
      )}
    </div>
  );
};

export default Incidencias;
