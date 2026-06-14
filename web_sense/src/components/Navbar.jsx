export default function Navbar({ isLive }) {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-sm">👁</div>
        <span className="text-white font-semibold text-lg tracking-tight">Sixth Sense</span>
      </div>


      <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${
        isLive
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : 'bg-white/5 border-white/10 text-gray-400'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${isLive ? 'animate-pulse-dot' : ''}`} />
        {isLive ? 'Live' : 'Privacy-First'}
      </div>
    </nav>
  )
}
