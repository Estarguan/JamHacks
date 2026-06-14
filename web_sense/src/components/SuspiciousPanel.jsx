export default function SuspiciousPanel({ countdown, result, onDismiss }) {
  if (!result) {
    const progress = ((10 - countdown) / 10) * 100

    return (
      <div className="bg-yellow-500/[0.05] border border-yellow-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl animate-pulse">🔍</span>
          <h3 className="text-yellow-400 font-semibold">Suspicious Activity — Analyzing</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Recording for <span className="text-white font-medium">{countdown}s</span> — triggers paused
        </p>
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <div
            className="bg-yellow-400 h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  const isAlert = result.decision === 'send_alert'
  const isContinue = result.decision === 'continue_analyzing'
  const isNormal = result.decision === 'return_to_normal'

  const decisionLabel = {
    send_alert: '🚨 Alert Sent',
    continue_analyzing: '🔄 Continuing Analysis',
    return_to_normal: '✅ Returned to Normal',
  }[result.decision]

  const borderColor = isAlert
    ? 'border-red-500/30 bg-red-500/[0.04]'
    : isContinue
    ? 'border-yellow-500/20 bg-yellow-500/[0.04]'
    : 'border-green-500/20 bg-green-500/[0.04]'

  const labelColor = isAlert ? 'text-red-400' : isContinue ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className={`border rounded-2xl p-6 ${borderColor}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${labelColor}`}>{decisionLabel}</h3>
        <span className="text-xs text-gray-500">Confidence: {result.confidence}/10</span>
      </div>

      <div className="w-full bg-white/5 rounded-full h-1.5 mb-4">
        <div
          className={`h-1.5 rounded-full ${isAlert ? 'bg-red-400' : isContinue ? 'bg-yellow-400' : 'bg-green-400'}`}
          style={{ width: `${(result.confidence / 10) * 100}%` }}
        />
      </div>

      <p className="text-gray-400 text-sm leading-relaxed mb-4">{result.analysis}</p>

      {(isAlert || isNormal) && (
        <button
          onClick={onDismiss}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline"
        >
          {isNormal ? 'Proceed' : 'Dismiss'}
        </button>
      )}
    </div>
  )
}
