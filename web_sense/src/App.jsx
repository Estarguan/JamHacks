import { useState, useRef, useCallback } from 'react'
import Navbar from './components/Navbar'
import AlertFeed from './components/AlertFeed'
import CameraFeed from './components/CameraFeed'
import SuspiciousPanel from './components/SuspiciousPanel'
import useMotionSocket from './hooks/useMotionSocket'
import useAudioTrigger from './hooks/useAudioTrigger'
import useCamera from './hooks/useCamera'
import useSuspiciousMode from './hooks/useSuspiciousMode'
import useStreamRelay from './hooks/useStreamRelay'
import './App.css'

export default function App() {
  const isMonitoring = true
  const [isSuspicious, setIsSuspicious] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [alerts, setAlerts] = useState([])
  const monitorRef = useRef(null)

  const { streamRef, ready, error } = useCamera()
  useStreamRelay(streamRef, ready)
  const { analyze } = useSuspiciousMode()
  const analyzingRef = useRef(false)

  const enterSuspiciousMode = useCallback(async () => {
    if (analyzingRef.current) return
    analyzingRef.current = true
    setIsSuspicious(true)
    setAnalysisResult(null)
    setCountdown(10)

    try {
      const result = await analyze(streamRef, setCountdown)
      setAnalysisResult(result)

      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

      if (result.decision === 'send_alert') {
        setAlerts(prev => [{ id: Date.now(), time, type: 'alert', confidence: result.confidence }, ...prev])
      } else if (result.decision === 'continue_analyzing') {
        analyzingRef.current = false
        setTimeout(() => enterSuspiciousMode(), 1000)
      }
    } catch (err) {
      console.error('Analysis failed:', err)
      setIsSuspicious(false)
      analyzingRef.current = false
    }
  }, [analyze, streamRef])

  const handleTrigger = useCallback((type) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setAlerts(prev => [{ id: Date.now(), time, type }, ...prev])
    if (!isSuspicious) enterSuspiciousMode()
  }, [isSuspicious, enterSuspiciousMode])

  useMotionSocket(
    () => handleTrigger('motion'),
    () => handleTrigger('keyword'),
  )
  useAudioTrigger(isMonitoring && !isSuspicious, () => handleTrigger('audio'))

  function dismissAlert() {
    setIsSuspicious(false)
    setAnalysisResult(null)
    analyzingRef.current = false
  }

  function handleTryDemo() {
    setIsMonitoring(true)
    monitorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-gray-300 font-sans">
      <Navbar isLive={isMonitoring} />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
          <span>🛡️</span>
          <span>Household Conflict Detection · Hackathon MVP</span>
        </div>

        <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
          Detect tension{' '}
          <span className="text-purple-400">before it escalates</span>
        </h1>

        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Sixth Sense connects to a home camera and uses AI to continuously
          monitor for household conflict — classifying risk levels in real time so
          families can act early, discreetly and privately.
        </p>

        <div className="flex items-center justify-center">
          <button
            onClick={handleTryDemo}
            className="px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-full transition-colors"
          >
            Try the Demo
          </button>
        </div>
      </section>

      {/* Live Monitoring */}
      <section ref={monitorRef} className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Live Monitoring</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Connect to your camera to begin monitoring. Triggers fire automatically when suspicious activity is detected.
          </p>
        </div>

        {isSuspicious && (
          <div className="mb-6">
            <SuspiciousPanel countdown={countdown} result={analysisResult} onDismiss={dismissAlert} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 h-[480px]">
          <CameraFeed streamRef={streamRef} ready={ready} error={error} />
          <AlertFeed alerts={alerts} />
        </div>

        <div className="flex gap-4 mt-6 justify-center">
          <button
            onClick={async () => {
              await fetch('http://localhost:3001/test-speech', { method: 'POST' })
              new Audio('http://localhost:3001/audio/latest').play()
            }}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-full transition-colors"
          >
            Play Alert Audio
          </button>
          <button
            onClick={() => fetch('http://localhost:3001/test-notification', { method: 'POST' })}
            className="px-6 py-3 bg-red-600/80 hover:bg-red-500 text-white font-semibold rounded-full transition-colors"
          >
            Send Test Notification
          </button>
        </div>
      </section>
    </div>
  )
}
