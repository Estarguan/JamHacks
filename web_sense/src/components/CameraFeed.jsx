import { useEffect, useRef } from 'react'

export default function CameraFeed({ streamRef, ready, error }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [ready])

  return (
    <div className="bg-[#12141a] border border-white/8 rounded-2xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Camera Feed</span>
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="relative aspect-video bg-black flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-4xl opacity-20">📷</span>
            <span className="text-gray-600 text-sm">{error || 'Starting camera...'}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-white/5">
        <p className="text-xs text-gray-600">Monitoring active — watching for suspicious activity</p>
      </div>
    </div>
  )
}
