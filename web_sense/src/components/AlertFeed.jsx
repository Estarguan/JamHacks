const ALERT_CONFIG = {
  motion:   { icon: '⚡', label: 'Fast movement detected' },
  audio:    { icon: '🔊', label: 'Loud sound detected' },
  keyword:  { icon: '🗣️', label: 'Keyword detected' },
  alert:    { icon: '🚨', label: 'Emergency alert triggered' },
}

export default function AlertFeed({ alerts }) {
  return (
    <div className="bg-[#12141a] border border-white/8 rounded-2xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Recent Alerts</span>
        <span className="text-xs text-gray-600">{alerts.length} total</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-2">
            <span className="text-3xl opacity-20">🛡️</span>
            <p className="text-gray-600 text-sm">No alerts yet — all clear</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((alert) => {
              const config = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.motion
              return (
                <li key={alert.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-base mt-0.5">{config.icon}</span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm text-gray-200 font-medium">{config.label}</span>
                    {alert.confidence !== undefined && (
                      <span className="text-xs text-red-400">Confidence: {alert.confidence}/10</span>
                    )}
                    <span className="text-xs text-gray-600">{alert.time}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
