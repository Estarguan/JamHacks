import { useEffect, useRef } from 'react'
import { AudioTriggerEngine } from '../../../backend/normal_mode/audioTriggerEngine.js'

export default function useAudioTrigger(isMonitoring, onTrigger) {
  const engineRef = useRef(null)

  useEffect(() => {
    if (isMonitoring) {
      engineRef.current = new AudioTriggerEngine({
        sensitivityPreset: 'medium',
        onTrigger: (event) => onTrigger(event),
      })
      engineRef.current.start()
    } else {
      if (engineRef.current) {
        engineRef.current.stop()
        engineRef.current = null
      }
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.stop()
        engineRef.current = null
      }
    }
  }, [isMonitoring])
}
