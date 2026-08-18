import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../services/api';
import './TicketChatModal.css';

/** Extrae el ID numérico real de la incidencia (limpia prefijos como inc_5, sol_123, etc.) */
const extraerIdNumerico = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'number') return raw;
  const str = String(raw);
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const TicketChatModal = ({ incidencia, onClose }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext) || {};
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [isClosed, setIsClosed] = useState(
    (incidencia.estado || '').toLowerCase() === 'resuelta' || (incidencia.estado || '').toLowerCase() === 'cerrada'
  );
  const messagesEndRef = useRef(null);

  // ID numérico real para la BD y las salas de WebSocket
  const incidenciaId = extraerIdNumerico(incidencia.id || incidencia.incidencia_id);

  // Serial del equipo
  let serial = incidencia.equipo_serial || incidencia.serial_real || incidencia.serial;
  if (!serial && incidencia.equipo_nombre && incidencia.equipo_nombre.includes('(')) {
    const match = incidencia.equipo_nombre.match(/\(([^)]+)\)/);
    if (match) serial = match[1];
  }
  if (!serial) serial = 'Sin serial';

  const titulo = incidencia.titulo || incidencia.correo || 'Incidencia de Soporte';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Cargar historial de la BD y unirse a la sala del chat
  useEffect(() => {
    if (!incidenciaId) return;

    api.get(`/incidencias/${incidenciaId}/mensajes`)
      .then(res => {
        const msgs = res.data || [];
        setMensajes(msgs);
        // Si ya hay un mensaje de cierre en la BD, marcar como cerrado
        if (msgs.some(m => m.es_cierre || (m.mensaje && m.mensaje.includes('Incidencia finalizada')))) {
          setIsClosed(true);
        }
        setTimeout(scrollToBottom, 150);
      })
      .catch(err => console.warn('Error cargando mensajes:', err));

    if (socket) {
      socket.emit('join_chat', { incidencia_id: incidenciaId });
    }
  }, [incidenciaId, socket, scrollToBottom]);

  // Escuchar mensajes y eventos de cierre en tiempo real vía WebSocket
  useEffect(() => {
    if (!socket || !incidenciaId) return;

    const handleNuevoMensaje = (msg) => {
      const msgIncId = extraerIdNumerico(msg.incidencia_id);
      if (msgIncId === incidenciaId) {
        setMensajes(prev => {
          if (msg.id && prev.find(m => m.id === msg.id)) return prev;
          const sinTemp = prev.filter(m => !(m._temp && m.remitente_id === msg.remitente_id && m.mensaje === msg.mensaje));
          return [...sinTemp, msg];
        });
        if (msg.es_cierre || (msg.mensaje && msg.mensaje.includes('Incidencia finalizada'))) {
          setIsClosed(true);
        }
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleChatFinalizado = (data) => {
      const targetId = extraerIdNumerico(data.incidencia_id);
      if (targetId === incidenciaId) {
        setIsClosed(true);
      }
    };

    socket.on('nuevo_mensaje', handleNuevoMensaje);
    socket.on('chat_finalizado', handleChatFinalizado);

    return () => {
      socket.off('nuevo_mensaje', handleNuevoMensaje);
      socket.off('chat_finalizado', handleChatFinalizado);
    };
  }, [socket, incidenciaId, scrollToBottom]);

  const handleSend = (e) => {
    e.preventDefault();
    if (isClosed || !nuevoMensaje.trim() || !user || !incidenciaId) return;

    const msgText = nuevoMensaje.trim();
    setNuevoMensaje('');

    // Añadir mensaje temporal de forma inmediata (optimistic update)
    const tempMsg = {
      _temp: true,
      id: `temp_${Date.now()}`,
      incidencia_id: incidenciaId,
      remitente_id: user.id,
      remitente_nombre: user.nombre,
      remitente_rol: user.rol_id,
      mensaje: msgText,
      fecha_envio: new Date().toISOString()
    };
    setMensajes(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    // Emitir por WebSocket (el servidor guardará en MySQL y reenviará)
    if (socket) {
      socket.emit('enviar_mensaje', {
        incidencia_id: incidenciaId,
        remitente_id: user.id,
        remitente_nombre: user.nombre,
        remitente_rol: user.rol_id,
        mensaje: msgText,
        usuario_id: incidencia.usuario_id,
        equipo_serial: serial,
        titulo: titulo
      });
    } else {
      // Fallback HTTP
      api.post(`/incidencias/${incidenciaId}/mensajes`, { mensaje: msgText })
        .then(res => {
          setMensajes(prev => {
            const sinTemp = prev.filter(m => !(m._temp && m.mensaje === msgText));
            return [...sinTemp, res.data];
          });
          setTimeout(scrollToBottom, 100);
        })
        .catch(err => console.error('Error enviando mensaje:', err));
    }
  };

  return (
    <div className="ticket-chat-overlay">
      <div className="ticket-chat-header">
        <div className="ticket-chat-header-info">
          <h4>💬 {titulo} {isClosed && <span style={{ fontSize: '0.75rem', color: '#ffc107', marginLeft: '6px' }}>(Finalizado)</span>}</h4>
          <span className="ticket-chat-serial-badge">PC: {serial}</span>
        </div>
        <button className="ticket-chat-close-btn" onClick={onClose} title="Cerrar chat">
          &times;
        </button>
      </div>

      <div className="ticket-chat-body">
        {mensajes.length === 0 ? (
          <div className="chat-empty">
            No hay mensajes aún. ¡Comienza la conversación para brindar ayuda!
          </div>
        ) : (
          mensajes.map((msg, index) => {
            const isClosureMsg = msg.es_cierre || (msg.mensaje && msg.mensaje.includes('Incidencia finalizada'));
            if (isClosureMsg) {
              return (
                <div key={msg.id || index} className="chat-closure-banner">
                  <div className="chat-closure-icon">🔒</div>
                  <div className="chat-closure-text">{msg.mensaje}</div>
                </div>
              );
            }

            const isMine = msg.remitente_id === user?.id;
            return (
              <div
                key={msg.id || index}
                className={`chat-message ${isMine ? 'chat-message--mine' : 'chat-message--other'}`}
              >
                <span className="chat-message-sender">
                  {isMine ? 'Tú' : msg.remitente_nombre} ({msg.remitente_rol === 1 ? 'Admin' : msg.remitente_rol === 2 ? 'Técnico' : 'Usuario'})
                </span>
                <div className="chat-message-bubble">
                  {msg.mensaje}
                  <span className="chat-message-time">
                    {msg.fecha_envio ? new Date(msg.fecha_envio).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
        {isClosed && (
          <div className="chat-closed-notice">
            🔒 Este chat ha sido finalizado. Gracias por utilizar el soporte técnico.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ticket-chat-footer" onSubmit={handleSend}>
        <input
          type="text"
          className="ticket-chat-input"
          placeholder={isClosed ? "Este chat ha finalizado..." : "Escribe un mensaje..."}
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          disabled={isClosed}
          autoFocus={!isClosed}
        />
        <button type="submit" className="ticket-chat-send-btn" title="Enviar" disabled={isClosed}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default TicketChatModal;
