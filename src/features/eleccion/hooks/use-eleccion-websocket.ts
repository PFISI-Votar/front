import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface EleccionAbiertaEvent {
  idEleccion: number;
}

interface UseEleccionWebSocketOptions {
  onEleccionAbierta?: (data: EleccionAbiertaEvent) => void;
}

/**
 * Hook para conectar y escuchar eventos WebSocket de elecciones.
 * Se reconecta automáticamente en caso de desconexión.
 */
export function useEleccionWebSocket(options: UseEleccionWebSocketOptions = {}) {
  const { onEleccionAbierta } = options;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Crear conexión WebSocket
    const socket = io(`${BACKEND_URL}/elecciones`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Conectado al servidor de elecciones');
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Error de conexión:', error);
    });

    // Escuchar evento de elección abierta
    socket.on('eleccion:abierta', (data: EleccionAbiertaEvent) => {
      console.log('[WebSocket] Elección abierta:', data);
      onEleccionAbierta?.(data);
    });

    // Cleanup al desmontar
    return () => {
      console.log('[WebSocket] Cerrando conexión');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onEleccionAbierta]);

  return socketRef.current;
}
