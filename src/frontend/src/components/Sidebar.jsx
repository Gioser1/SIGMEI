import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboardIcon, 
  MonitorIcon, 
  AlertCircleIcon, 
  WrenchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CpuIcon,
  RemoteIcon
} from './Icons';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user } = useContext(AuthContext);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <MonitorIcon className="brand-icon" />
          </div>
          {!isCollapsed && <span className="brand-text">SIGMEI</span>}
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
        </button>
      </div>

      <div className="sidebar-content">
        <span className="sidebar-category">{!isCollapsed ? 'General' : '•••'}</span>
        <ul className="sidebar-menu">
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
              title="Dashboard"
            >
              <LayoutDashboardIcon className="sidebar-icon" />
              {!isCollapsed && <span className="link-text">Dashboard</span>}
            </NavLink>
          </li>
          
          {user?.rol_id !== 3 && (
            <li>
              <NavLink 
                to="/equipos" 
                className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                title="Equipos"
              >
                <MonitorIcon className="sidebar-icon" />
                {!isCollapsed && <span className="link-text">Equipos</span>}
              </NavLink>
            </li>
          )}

          <li>
            <NavLink 
              to="/mi-pc" 
              className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
              title="My PC"
            >
              <CpuIcon className="sidebar-icon" />
              {!isCollapsed && <span className="link-text">My PC</span>}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/incidencias" 
              className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
              title="Incidencias"
            >
              <AlertCircleIcon className="sidebar-icon" />
              {!isCollapsed && <span className="link-text">Incidencias</span>}
            </NavLink>
          </li>

          {user?.rol_id !== 3 && (
            <li>
              <NavLink 
                to="/mantenimientos" 
                className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                title="Mantenimientos"
              >
                <WrenchIcon className="sidebar-icon" />
                {!isCollapsed && <span className="link-text">Mantenimientos</span>}
              </NavLink>
            </li>
          )}
          
          <li>
            <NavLink 
              to="/soporte-remoto" 
              className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
              title="Soporte Remoto"
            >
              <RemoteIcon className="sidebar-icon" />
              {!isCollapsed && <span className="link-text">Soporte Remoto</span>}
            </NavLink>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
