import { EditIcon, TrashIcon } from './Icons';
import './DataTable.css';

const DataTable = ({ columns, data, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col.header}</th>
              ))}
              {(onEdit || onDelete) && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((item) => (
              <tr key={item} className="skeleton-row">
                {columns.map((_, colIndex) => (
                  <td key={colIndex}>
                    <div className="skeleton-cell" style={{ width: `${Math.random() * 40 + 40}%` }}></div>
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td>
                    <div className="skeleton-cell" style={{ width: '60px' }}></div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col.header}</th>
              ))}
              {(onEdit || onDelete) && <th>Acciones</th>}
            </tr>
          </thead>
        </table>
        <div className="table-empty">
          <p>No se encontraron registros.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.header}</th>
            ))}
            {(onEdit || onDelete) && <th style={{ width: '100px' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="table-actions">
                  {onEdit && (
                    <button 
                      className="btn-icon edit" 
                      onClick={() => onEdit(row)}
                      title="Editar"
                    >
                      <EditIcon size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      className="btn-icon delete" 
                      onClick={() => onDelete(row)}
                      title="Eliminar"
                    >
                      <TrashIcon size={16} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
