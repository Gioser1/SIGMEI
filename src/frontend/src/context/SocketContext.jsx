import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import TicketChatModal from '../components/TicketChatModal';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Estado para el chat activo de la incidencia
  const [activeChatIncidencia, setActiveChatIncidencia] = useState(null);

  const openChat = (incidenciaData) => {
    if (!incidenciaData) return;
    const chatObj = {
      ...incidenciaData,
      id: incidenciaData.id || incidenciaData.incidencia_id,
      incidencia_id: incidenciaData.id || incidenciaData.incidencia_id,
      _t: Date.now()
    };
    setActiveChatIncidencia(chatObj);

    // Si quien abre es técnico/admin (rol 1 o 2), notificar al usuario vía WebSocket
    if (socket && (user?.rol_id === 1 || user?.rol_id === 2)) {
      socket.emit('abrir_chat_tecnico', {
        incidencia_id: chatObj.incidencia_id,
        usuario_id: incidenciaData.usuario_id,
        equipo_serial: incidenciaData.equipo_serial || incidenciaData.serial_real || incidenciaData.serial,
        titulo: incidenciaData.titulo || incidenciaData.correo
      });
    }
  };

  const closeChat = () => {
    setActiveChatIncidencia(null);
  };

  useEffect(() => {
    // Only connect if user is logged in
    if (user && token) {
      const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
      
      const newSocket = io(backendUrl, {
        auth: { token },
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ WebSockets conectados al servidor');
        newSocket.emit('join_room', {
          usuario_id: user.id,
          rol_id: user.rol_id
        });
      });

      newSocket.on('nueva_notificacion', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        console.log("Nueva notificación recibida:", notif);
      });

      // Escuchar cuando un técnico o admin abre el chat para el usuario
      newSocket.on('abrir_chat_usuario', (chatData) => {
        console.log("💬 El técnico abrió el chat para ti:", chatData);
        setActiveChatIncidencia({
          id: chatData.incidencia_id,
          incidencia_id: chatData.incidencia_id,
          usuario_id: chatData.usuario_id,
          equipo_serial: chatData.equipo_serial,
          titulo: chatData.titulo,
          _t: Date.now()
        });
      });

      // Escuchar cuando un usuario envía un mensaje nuevo al técnico/admin
      newSocket.on('abrir_chat_tecnico_desde_usuario', (chatData) => {
        console.log("💬 Nuevo mensaje de usuario recibido para chat:", chatData);
        setActiveChatIncidencia(prev => {
          // Si no hay chat abierto o es diferente, abrirlo automáticamente
          if (!prev || prev.incidencia_id !== chatData.incidencia_id) {
            return {
              id: chatData.incidencia_id,
              incidencia_id: chatData.incidencia_id,
              usuario_id: chatData.remitente_id,
              equipo_serial: chatData.equipo_serial,
              titulo: chatData.titulo || chatData.mensaje,
              _t: Date.now()
            };
          }
          return prev;
        });
      });

      return () => {
        newSocket.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [user, token]);

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAllAsRead, openChat, closeChat, activeChatIncidencia }}>
      {children}
      {activeChatIncidencia && (
        <TicketChatModal incidencia={activeChatIncidencia} onClose={closeChat} />
      )}
    </SocketContext.Provider>
  );
};
