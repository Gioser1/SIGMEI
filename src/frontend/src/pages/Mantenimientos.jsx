import { useState, useEffect } from 'react';
import {
  obtenerMantenimientos,
  crearMantenimiento,
  actualizarMantenimiento,
  eliminarMantenimiento
} from '../services/mantenimientosService';
import DataTable from '../components/DataTable';
import MantenimientoModal from '../components/MantenimientoModal';
import './Mantenimientos.css';

const Mantenimientos = () => {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginación y búsqueda
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mantenimientoEditando, setMantenimientoEditando] = useState(null);

  const fetchMantenimientos = async () => {
    setLoading(true);
    try {
      const data = await obtenerMantenimientos({ page, limit: 10, q: search });
      if (Array.isArray(data)) {
        setMantenimientos(data);
        setTotalPages(1);
      } else {
        setMantenimientos(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error al obtener mantenimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMantenimientos();
  }, [page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openNewModal = () => {
    setMantenimientoEditando(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mantenimiento) => {
    setMantenimientoEditando(mantenimiento);
    setIsModalOpen(true);
  };

  const handleDelete = async (mantenimiento) => {
    const desc = mantenimiento.descripcion
      ? mantenimiento.descripcion.substring(0, 50)
      : `ID ${mantenimiento.id}`;
    if (window.confirm(`¿Estás seguro de eliminar el mantenimiento: "${desc}"?`)) {
      try {
        await eliminarMantenimiento(mantenimiento.id);
        fetchMantenimientos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('No se pudo eliminar el mantenimiento.');
      }
    }
  };

  const handleSaveModal = async (formData) => {
    if (mantenimientoEditando) {
      await actualizarMantenimiento(mantenimientoEditando.id, formData);
    } else {
      await crearMantenimiento(formData);
    }
    setIsModalOpen(false);
    setMantenimientoEditando(null);
    fetchMantenimientos();
  };

  // Helper para normalizar texto para clase CSS
  const normalizeClass = (text) => {
    if (!text) return '';
    return text.toLowerCase().replace(/\s+/g, '_');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    {
      header: 'Equipo',
      accessor: 'equipo_nombre',
      render: (row) => row.equipo_nombre || `ID: ${row.equipo_id}`
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      render: (row) => (
        <span className={`badge tipo-${normalizeClass(row.tipo)}`}>
          {row.tipo ? row.tipo.charAt(0).toUpperCase() + row.tipo.slice(1) : '—'}
        </span>
      )
    },
    {
      header: 'Descripción',
      accessor: 'descripcion',
      render: (row) => {
        const desc = row.descripcion || '';
        return desc.length > 40 ? desc.substring(0, 40) + '...' : desc || '—';
      }
    },
    {
      header: 'Fecha',
      accessor: 'fecha',
      render: (row) => formatDate(row.fecha)
    },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (row) => (
        <span className={`badge estado-${normalizeClass(row.estado)}`}>
          {row.estado ? row.estado.charAt(0).toUpperCase() + row.estado.slice(1).replace('_', ' ') : '—'}
        </span>
      )
    }
  ];

  return (
    <div className="mantenimientos-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Gestión de Mantenimientos</h1>
          <p>Programa y registra los mantenimientos de los equipos.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          + Nuevo Mantenimiento
        </button>
      </div>

      <div className="table-controls">
        <input
          type="text"
          placeholder="Buscar mantenimiento..."
          value={search}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      <DataTable
        columns={columns}
        data={mantenimientos}
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
        <MantenimientoModal
          onClose={() => {
            setIsModalOpen(false);
            setMantenimientoEditando(null);
          }}
          onSave={handleSaveModal}
          mantenimiento={mantenimientoEditando}
        />
      )}
    </div>
  );
};

export default Mantenimientos;
