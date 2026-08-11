import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface EleccionAbiertaEvent {
  idEleccion: number
}

interface EleccionCerradaEvent {
  idEleccion: number
}

interface EleccionArchivadaEvent {
  idEleccion: number
}

interface MerklePublicadoEvent {
  idEleccion: number
}

interface UseEleccionWebSocketOptions {
  onEleccionAbierta?: (data: EleccionAbiertaEvent) => void
  onEleccionCerrada?: (data: EleccionCerradaEvent) => void
  onEleccionArchivada?: (data: EleccionArchivadaEvent) => void
  onMerklePublicado?: (data: MerklePublicadoEvent) => void
}

/**
 * Hook para conectar y escuchar eventos WebSocket de elecciones.
 * Se reconecta automáticamente en caso de desconexión.
 * Callbacks se guardan en refs para no recrear el socket en cada render.
 */
export function useEleccionWebSocket(
  options: UseEleccionWebSocketOptions = {}
) {
  const onEleccionAbiertaRef = useRef(options.onEleccionAbierta)
  const onEleccionCerradaRef = useRef(options.onEleccionCerrada)
  const onEleccionArchivadaRef = useRef(options.onEleccionArchivada)
  const onMerklePublicadoRef = useRef(options.onMerklePublicado)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    onEleccionAbiertaRef.current = options.onEleccionAbierta
  }, [options.onEleccionAbierta])

  useEffect(() => {
    onEleccionCerradaRef.current = options.onEleccionCerrada
  }, [options.onEleccionCerrada])

  useEffect(() => {
    onEleccionArchivadaRef.current = options.onEleccionArchivada
  }, [options.onEleccionArchivada])

  useEffect(() => {
    onMerklePublicadoRef.current = options.onMerklePublicado
  }, [options.onMerklePublicado])

  useEffect(() => {
    const socket = io(`${BACKEND_URL}/elecciones`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    socketRef.current = socket

    socket.on('eleccion:abierta', (data: EleccionAbiertaEvent) => {
      onEleccionAbiertaRef.current?.(data)
    })

    socket.on('eleccion:cerrada', (data: EleccionCerradaEvent) => {
      onEleccionCerradaRef.current?.(data)
    })

    socket.on('eleccion:archivada', (data: EleccionArchivadaEvent) => {
      onEleccionArchivadaRef.current?.(data)
    })

    socket.on('eleccion:merkle-publicado', (data: MerklePublicadoEvent) => {
      onMerklePublicadoRef.current?.(data)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])
}
