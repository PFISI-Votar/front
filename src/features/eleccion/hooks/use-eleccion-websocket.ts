import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface EleccionAbiertaEvent {
  idEleccion: number
}

interface MerklePublicadoEvent {
  idEleccion: number
}

interface UseEleccionWebSocketOptions {
  onEleccionAbierta?: (data: EleccionAbiertaEvent) => void
  onMerklePublicado?: (data: MerklePublicadoEvent) => void
}

/**
 * Hook para conectar y escuchar eventos WebSocket de elecciones.
 * Se reconecta automáticamente en caso de desconexión.
 */
export function useEleccionWebSocket(
  options: UseEleccionWebSocketOptions = {}
) {
  const { onEleccionAbierta, onMerklePublicado } = options
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Crear conexión WebSocket
    const socket = io(`${BACKEND_URL}/elecciones`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      // WebSocket conectado
    })

    socket.on('disconnect', () => {
      // WebSocket desconectado
    })

    socket.on('connect_error', () => {
      // Error de conexión WebSocket
    })

    // Escuchar evento de elección abierta
    socket.on('eleccion:abierta', (data: EleccionAbiertaEvent) => {
      onEleccionAbierta?.(data)
    })

    // Escuchar evento de Merkle publicado
    socket.on('eleccion:merkle-publicado', (data: MerklePublicadoEvent) => {
      onMerklePublicado?.(data)
    })

    // Cleanup al desmontar
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [onEleccionAbierta, onMerklePublicado])
}
