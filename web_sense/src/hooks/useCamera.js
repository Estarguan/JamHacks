import { useEffect, useRef, useState } from 'react'

export default function useCamera() {
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function start() {
      try {
        // Get permission first so device labels become readable
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        tempStream.getTracks().forEach(t => t.stop())

        // Find DroidCam virtual camera device
        const devices = await navigator.mediaDevices.enumerateDevices()
        const phoneCamera = devices.find(
          d => d.kind === 'videoinput' && (
            d.label.toLowerCase().includes('camo') ||
            d.label.toLowerCase().includes('reincubate') ||
            d.label.toLowerCase().includes('droid')
          )
        )

        const phoneMic = devices.find(
          d => d.kind === 'audioinput' && (
            d.label.toLowerCase().includes('camo') ||
            d.label.toLowerCase().includes('reincubate') ||
            d.label.toLowerCase().includes('droid')
          )
        )

        const videoConstraints = phoneCamera
          ? { deviceId: { exact: phoneCamera.deviceId } }
          : true

        const audioConstraints = phoneMic
          ? { deviceId: { exact: phoneMic.deviceId } }
          : true

        if (phoneCamera) console.log('Using phone camera:', phoneCamera.label)
        else console.warn('Phone camera not found — falling back to default')

        if (phoneMic) console.log('Using phone mic:', phoneMic.label)
        else console.warn('Phone mic not found — falling back to default')

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        })
        streamRef.current = stream
        setReady(true)
      } catch {
        setError('Camera or microphone access denied.')
      }
    }
    start()
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  return { streamRef, ready, error }
}
