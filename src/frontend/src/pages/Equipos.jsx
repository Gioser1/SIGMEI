import { useState, useEffect, useMemo } from 'react';
import { obtenerEquipos, crearEquipo, actualizarEquipo, eliminarEquipo } from '../services/equiposService';
import DataTable from '../components/DataTable';
import EquipoModal from '../components/EquipoModal';
import './Equipos.css';


const FILTROS_ESTADO = [
  { key: 'todos', label: 'Todos' },
  { key: 'activo', label: 'Activos' },
  { key: 'inactivo', label: 'Inactivos' },
  { key: 'mantenimiento', label: 'En Mantenimiento' },
];

const Equipos = () => {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginación y búsqueda
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);

  const fetchEquipos = async () => {
    setLoading(true);
    try {
      const data = await obtenerEquipos({ page, search });
      setEquipos(data.data || data);
    } catch (error) {
      console.error("Error al obtener equipos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipos();
  }, [page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openNewModal = () => {
    setEquipoEditando(null);
    setIsModalOpen(true);
  };

  const openEditModal = (equipo) => {
    setEquipoEditando(equipo);
    setIsModalOpen(true);
  };

  const handleDelete = async (equipo) => {
    if (window.confirm(`¿Estás seguro de eliminar el equipo: ${equipo.nombre}?`)) {
      try {
        await eliminarEquipo(equipo.id);
        fetchEquipos();
      } catch (error) {
        console.error("Error al eliminar", error);
        alert("No se pudo eliminar el equipo");
      }
    }
  };

  const handleSaveModal = async (formData) => {
    try {
      if (equipoEditando) {
        await actualizarEquipo(equipoEditando.id, formData);
      } else {
        await crearEquipo(formData);
      }
      setIsModalOpen(false);
      fetchEquipos();
    } catch (error) {
      console.error("Error al guardar", error);
      alert("Error al guardar el equipo");
    }
  };

  // Filtro por estado aplicado en cliente sobre lo ya cargado
  const equiposFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return equipos;
    return equipos.filter(
      (e) => e.estado?.toLowerCase() === filtroEstado
    );
  }, [equipos, filtroEstado]);

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Marca', accessor: 'marca' },
    { header: 'Modelo', accessor: 'modelo' },
    { header: 'N/S', accessor: 'numero_serie' },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (row) => (
        <span className={`badge badge-${row.estado.toLowerCase()}`}>
          {row.estado}
        </span>
      )
    }
  ];

  return (
    <div className="equipos-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Gestión de Equipos</h1>
          <p>Administra el inventario de hardware.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Equipo
        </button>
      </div>

      <div className="table-toolbar">
        <div className="table-controls">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, marca o N/S..."
              value={search}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          <span className="results-count">
            <strong>{equiposFiltrados.length}</strong> equipo{equiposFiltrados.length !== 1 ? 's' : ''} encontrado{equiposFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="filter-chips">
          {FILTROS_ESTADO.map((filtro) => (
            <button
              key={filtro.key}
              className={`filter-chip ${filtroEstado === filtro.key ? 'active' : ''}`}
              onClick={() => setFiltroEstado(filtro.key)}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-panel">
        <DataTable
          columns={columns}
          data={equiposFiltrados}
          loading={loading}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />

        <div className="pagination">
          <span className="pagination-info">Página {page}</span>
          <div className="pagination-controls">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <EquipoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        equipoBase={equipoEditando}
      />
    </div>
  );
};

export default Equipos;