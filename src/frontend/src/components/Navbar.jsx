import { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon, BellIcon, UserIcon } from './Icons';
import './Navbar.css';

const Navbar = () => {
  const { logout, user } = useContext(AuthContext);
  const { unreadCount, notifications, markAllAsRead } = useContext(SocketContext) || { unreadCount: 0, notifications: [], markAllAsRead: () => {} };
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotifs = () => {
    if (showNotifs) {
      markAllAsRead();
    }
    setShowNotifs(!showNotifs);
  };

  // Generar breadcrumbs simples basados en la ruta
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="breadcrumbs">
          <span className="breadcrumb-item text-muted">SIGMEI</span>
          {pathnames.map((path, index) => {
            const isLast = index === pathnames.length - 1;
            return (
              <span key={path} className="breadcrumb-segment">
                <span className="breadcrumb-separator">/</span>
                <span className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                  {path.charAt(0).toUpperCase() + path.slice(1)}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="navbar-right">
        <div className="search-container">
          <SearchIcon className="search-icon" size={16} />
          <input type="text" placeholder="Buscar..." className="search-input" />
          <div className="search-shortcut">Ctrl K</div>
        </div>

        <div className="navbar-actions">
          <div className="notif-wrapper" ref={notifRef}>
            <button className="icon-btn" title="Notificaciones" onClick={toggleNotifs}>
              <BellIcon size={18} />
              {unreadCount > 0 && (
                <span className="notification-dot">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="notif-dropdown animate-fade-in">
                <div className="notif-dropdown-header">
                  <span>Notificaciones</span>
                  {notifications.length > 0 && (
                    <button className="notif-clear" onClick={markAllAsRead}>Marcar leídas</button>
                  )}
                </div>
                <div className="notif-dropdown-body">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No hay notificaciones nuevas</div>
                  ) : (
                    notifications.slice(0, 10).map((n, idx) => (
                      <div key={idx} className={`notif-item ${n.read ? '' : 'notif-unread'}`}>
                        <div className="notif-item-icon">
                          {n.tipo === 'soporte' ? '🖥️' : '🎫'}
                        </div>
                        <div className="notif-item-content">
                          <strong>{n.titulo}</strong>
                          <p>{n.mensaje}</p>
                          <span className="notif-item-time">
                            {new Date(n.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="separator"></div>

          <div className="user-dropdown">
            <div className="avatar-btn">
              <div className="avatar">
                <UserIcon size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="user-name">{user?.nombre || 'Usuario'}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {user?.rol_id === 1 ? 'Administrador' : user?.rol_id === 2 ? 'Técnico' : 'Usuario'}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout-small" title="Cerrar sesión">
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
