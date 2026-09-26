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

interface EleccionPausadaEvent {
  idEleccion: number
  razon: string
}

interface EleccionReanudadaEvent {
  idEleccion: number
}

export type TransaccionEleccionTipo = 'APERTURA' | 'CIERRE'

interface TransaccionEnProgresoEvent {
  idEleccion: number
  tipo: TransaccionEleccionTipo
}

interface TransaccionFallidaEvent {
  idEleccion: number
  tipo: TransaccionEleccionTipo
}

interface UseEleccionWebSocketOptions {
  onEleccionAbierta?: (data: EleccionAbiertaEvent) => void
  onEleccionCerrada?: (data: EleccionCerradaEvent) => void
  onEleccionArchivada?: (data: EleccionArchivadaEvent) => void
  onMerklePublicado?: (data: MerklePublicadoEvent) => void
  onEleccionPausada?: (data: EleccionPausadaEvent) => void
  onEleccionReanudada?: (data: EleccionReanudadaEvent) => void
  /** VOTAR-481: la transacción on-chain (manual o automática) fue tomada y está en curso. */
  onTransaccionEnProgreso?: (data: TransaccionEnProgresoEvent) => void
  /**
   * VOTAR-481: la transacción on-chain que estaba en curso (ver
   * `onTransaccionEnProgreso`) terminó en falla o revert. El conflicto de
   * lock (409) NO dispara este evento: ya le llega al solicitante por la
   * respuesta HTTP de su propia request.
   */
  onTransaccionFallida?: (data: TransaccionFallidaEvent) => void
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
  const onEleccionPausadaRef = useRef(options.onEleccionPausada)
  const onEleccionReanudadaRef = useRef(options.onEleccionReanudada)
  const onTransaccionEnProgresoRef = useRef(options.onTransaccionEnProgreso)
  const onTransaccionFallidaRef = useRef(options.onTransaccionFallida)
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
    onEleccionPausadaRef.current = options.onEleccionPausada
  }, [options.onEleccionPausada])

  useEffect(() => {
    onEleccionReanudadaRef.current = options.onEleccionReanudada
  }, [options.onEleccionReanudada])

  useEffect(() => {
    onTransaccionEnProgresoRef.current = options.onTransaccionEnProgreso
  }, [options.onTransaccionEnProgreso])

  useEffect(() => {
    onTransaccionFallidaRef.current = options.onTransaccionFallida
  }, [options.onTransaccionFallida])

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

    socket.on('eleccion:pausada', (data: EleccionPausadaEvent) => {
      onEleccionPausadaRef.current?.(data)
    })

    socket.on('eleccion:reanudada', (data: EleccionReanudadaEvent) => {
      onEleccionReanudadaRef.current?.(data)
    })

    socket.on(
      'eleccion:transaccion-en-progreso',
      (data: TransaccionEnProgresoEvent) => {
        onTransaccionEnProgresoRef.current?.(data)
      }
    )

    socket.on(
      'eleccion:transaccion-fallida',
      (data: TransaccionFallidaEvent) => {
        onTransaccionFallidaRef.current?.(data)
      }
    )

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])
}
