import { useEffect, useRef } from 'react'

const WS_URL = 'ws://10.37.103.237:3001/ws/frames'
const FRAME_INTERVAL = 100 // 10 fps

export default function useStreamRelay(streamRef, ready) {
  const wsRef = useRef(null)

  useEffect(() => {
    if (!ready || !streamRef.current) return

    const canvas = document.createElement('canvas')
    const video = document.createElement('video')
    video.srcObject = streamRef.current
    video.muted = true
    video.playsInline = true
    video.play().catch(() => {})

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    let intervalId = null

    ws.onopen = () => {
      intervalId = setInterval(() => {
        if (video.readyState < 2 || ws.readyState !== WebSocket.OPEN) return
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        canvas.getContext('2d').drawImage(video, 0, 0)
        canvas.toBlob(blob => {
          if (!blob || ws.readyState !== WebSocket.OPEN) return
          blob.arrayBuffer().then(buf => ws.send(buf))
        }, 'image/jpeg', 0.7)
      }, FRAME_INTERVAL)
    }

    ws.onerror = () => clearInterval(intervalId)

    return () => {
      clearInterval(intervalId)
      video.pause()
      video.srcObject = null
      ws.close()
    }
  }, [ready])
}
