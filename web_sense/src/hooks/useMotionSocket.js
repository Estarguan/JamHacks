import { useEffect } from 'react'

export default function useMotionSocket(onMotion, onKeyword) {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8765')

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'motion') onMotion(data.time)
      else if (data.type === 'keyword') onKeyword?.(data)
    }

    ws.onerror = () => console.warn('Motion socket unavailable')

    return () => ws.close()
  }, [])
}
